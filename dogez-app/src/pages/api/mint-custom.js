import { createCanvas, loadImage } from 'canvas';
import Web3 from 'web3';
import { dogezAddress, dogezABI } from '../../contracts/dogez';
import fs from 'fs';
import { openDb } from '../../utils/db';
import { create } from 'kubo-rpc-client';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { selectedImages, userAddress, selectedToken, selectedCosmeticTokens } = req.body;

    // Initialize Web3 and contract
    const web3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
    const account = web3.eth.accounts.privateKeyToAccount(process.env.ANVIL_ACCOUNT_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = process.env.ANVIL_ACCOUNT;
    const dogezContract = new web3.eth.Contract(dogezABI, dogezAddress);

    // Generate the new token name
    selectedCosmeticTokens.sort((a, b) => a.id - b.id);
    const newName = [selectedToken.name, ...selectedCosmeticTokens.map(token => token.name)].join('_');

    for (const cosmetic of selectedCosmeticTokens) {
      if (selectedToken.name.includes(cosmetic.name)) {
          return res.status(400).json({ message: `The base/custom token already contains the cosmetic: ${cosmetic.name}.` });
      }
    }

    // Check if the combination already exists in the database
    const db = await openDb();
    const existingToken = await db.get(`SELECT id FROM tokens WHERE name = ?`, [newName]);

    let newItemId;

    if (existingToken) {
      // If the combination exists, use the existing token ID
      newItemId = existingToken.id;
    } else {

      const attachedCosmetics = await db.all(`SELECT cosmetic_token_id FROM token_attachments WHERE token_id = ?`, [selectedToken.id]);
      if (attachedCosmetics.length + selectedCosmeticTokens.length > 3) {
          return res.status(400).json({ message: 'The selected base/custom NFT already has 3 cosmetics attached. You cannot add more.' });
      }

      // Generate the composite image
      const canvas = createCanvas(300, 300);
      const ctx = canvas.getContext('2d');
      for (const imageUrl of selectedImages) {
        const image = await loadImage(imageUrl);
        ctx.drawImage(image, 0, 0, 300, 300);
      }
      const compositeImage = canvas.toBuffer('image/png');

      // Upload to IPFS
      console.log('IPFS_GATEWAY_URL:', process.env.IPFS_GATEWAY_URL);
      let imageUrl;
      const client = create({ url: process.env.IPFS_GATEWAY_URL });
      const { cid } = await client.add(compositeImage);
      imageUrl = `${process.env.IPFS_URL}/${cid}`;

      // Add a new row to the database
      const maxIdRow = await db.get(`SELECT MAX(id) as maxId FROM tokens`);
      newItemId = maxIdRow.maxId + 1;
      await db.run(
        `INSERT INTO tokens (id, name, type, image_url) VALUES (?, ?, ?, ?)`,
        [newItemId, newName, 'custom', imageUrl]
      );

      let originalBaseTokenId = selectedToken.id;
      while (true) {
        const baseToken = await db.get(`SELECT base_token_id FROM token_attachments WHERE token_id = ?`, [originalBaseTokenId]);
        if (baseToken && baseToken.base_token_id !== null) {
          originalBaseTokenId = baseToken.base_token_id;
        } else {
          break;
        }
      }

      const existingCosmetics = await db.all(`SELECT cosmetic_token_id FROM token_attachments WHERE token_id = ?`, [selectedToken.id]);
      const allCosmeticIds = [...new Set([...existingCosmetics.map(c => c.cosmetic_token_id), ...selectedCosmeticTokens.map(token => token.id)])];

      for (const cosmeticId of allCosmeticIds) {
        const existingAttachmentForNewToken = await db.get(`SELECT * FROM token_attachments WHERE token_id = ? AND cosmetic_token_id = ?`, [newItemId, cosmeticId]);
        if (!existingAttachmentForNewToken) {
          await db.run(
            `INSERT INTO token_attachments (token_id, base_token_id, cosmetic_token_id) VALUES (?, ?, ?)`,
            [newItemId, originalBaseTokenId, cosmeticId]
          );
        }
      }

      // Build metadata attributes
        const attributes = [
            { trait_type: "Type", value: selectedToken.type === 'base' || selectedToken.type === 'custom' ? 'doge' : 'cosmetic' },
            { trait_type: "Rarity", value: "Common" },
            ...(selectedToken.type === 'base' || selectedToken.type === 'custom' ? [{ trait_type: "Tier", value: selectedToken.type }] : []),
            ...selectedCosmeticTokens.map(token => ({ trait_type: "Cosmetic", value: token.name }))
        ];
    
        // Create metadata object
        const metadata = {
            name: `Dogez #${newItemId}`,
            description: `Dogez #${newItemId}`,
            image: imageUrl,
            attributes: attributes
        };
        
        // Write metadata to file
        const filePath = path.join(process.cwd(), 'public', 'json', `${newItemId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 4)); 
    }

    // Mint the token
    let gasEstimate;
    gasEstimate = await dogezContract.methods.mintNewToken(userAddress, newItemId, 1).estimateGas({ from: web3.eth.defaultAccount });
    await dogezContract.methods.mintNewToken(userAddress, newItemId, 1).send({ from: web3.eth.defaultAccount, gas: gasEstimate });

    // Burn the selected tokens
    const dogeId = selectedToken.id;
    const cosmeticIds = selectedCosmeticTokens.map(token => token.id);
    gasEstimate = await dogezContract.methods.burnTokens(userAddress, dogeId, cosmeticIds).estimateGas({ from: web3.eth.defaultAccount });
    await dogezContract.methods.burnTokens(userAddress, dogeId, cosmeticIds).send({ from: web3.eth.defaultAccount, gas: gasEstimate });

    res.status(200).json({ message: 'Minting successful ' + newItemId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
