import path from 'path';
import fs from 'fs';
import Web3 from 'web3';

import { dogezAddress, dogezABI } from '../../contracts/dogez';
import { openDb } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { userAddress, tokenId, imageUrl, markerId } = req.body;
      
      const web3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
      const account = web3.eth.accounts.privateKeyToAccount(process.env.ANVIL_ACCOUNT_PRIVATE_KEY);
      web3.eth.accounts.wallet.add(account);
      web3.eth.defaultAccount = process.env.ANVIL_ACCOUNT;
      const dogezContract = new web3.eth.Contract(dogezABI, dogezAddress);

      const gasEstimate = await dogezContract.methods.mintTo(userAddress, tokenId, 1).estimateGas({ from: web3.eth.defaultAccount });
      let txReceipt = await dogezContract.methods.mintTo(userAddress, tokenId, 1).send({ from: web3.eth.defaultAccount, gas: gasEstimate });

      let metadata = {
          name: `Dogez #${tokenId}`,
          description: `Dogez #${tokenId}`,
          image: imageUrl,
          attributes: [
              {
                  trait_type: "Type",
                  value: "Doge"
              },
              {
                  trait_type: "Rarity",
                  value: "Common"
              },
              {
                  trait_type: "Tier",
                  value: "Base"
              }
          ]
      };

      const filePath = path.join(process.cwd(), 'public', 'json', `${tokenId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 4));

      let sql = `DELETE FROM points WHERE id = ?`;
      let params = [markerId];

      const db = await openDb();
      db.run(sql, params, function(err) {
          if (err) {
              return console.error(err.message);
          }
          console.log(`Row(s) deleted ${params}`);
      });

      res.status(200).json({ message: 'Minting successful ' + tokenId });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
