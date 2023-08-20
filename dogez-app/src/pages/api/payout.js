// pages/api/payout.js
import Web3 from 'web3';
import { treatzAddress, treatzABI } from '../../contracts/treatz';

const web3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
const account = web3.eth.accounts.privateKeyToAccount(process.env.ANVIL_ACCOUNT_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const contractTreatz = new web3.eth.Contract(treatzABI, treatzAddress);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { address, treatzCollected } = req.body;

    // Check that the address is valid
    if (!Web3.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    try {
      // Convert the number of Treatz collected to Wei
      const tokensToSend = Web3.utils.toWei(treatzCollected.toString(), 'ether');

      // Estimate the gas cost of the transfer for Treatz
      const gasEstimateTreatz = await contractTreatz.methods.transfer(address, tokensToSend).estimateGas({ from: web3.eth.defaultAccount });

      // Send the transfer transaction for Treatz
      const txReceiptTreatz = await contractTreatz.methods.transfer(address, tokensToSend).send({ from: web3.eth.defaultAccount, gas: gasEstimateTreatz });

      console.log(txReceiptTreatz);

      // Respond with the transaction receipt
      res.json({ message: `Transferred ${tokensToSend} Treatz to ${address}`, txReceiptTreatz });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    // Handle any other HTTP method
    res.status(405).json({ error: 'Method not allowed' });
  }
}
