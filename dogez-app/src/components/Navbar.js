import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/react';
import { useAccount } from 'wagmi';
import { treatzAddress, treatzABI } from '../contracts/treatz';
import Web3 from 'web3';

export default function Navbar() {
  const [isClient, setIsClient] = useState(false);
  const { open } = useWeb3Modal();
  const { address } = useAccount();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (address) {
      // Call immediately
      loadBlockchainData(address);
  
      // Then set up interval
      const intervalId = setInterval(() => {
        loadBlockchainData(address);
      }, 10000); // Every 10 seconds
  
      // Clear interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [address]);

  async function loadBlockchainData(address) {
    try {
      const web3 = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new web3.eth.Contract(treatzABI, treatzAddress);
      let balance = await contract.methods.balanceOf(address).call();
      balance = web3.utils.fromWei(balance, 'ether');
      balance = parseInt(balance).toFixed(0);
      setBalance(balance);
    } catch (error) {
      console.log('Error fetching balance:', error);
    }
  }

  return (
    <nav className="flex items-center justify-between p-4 md:p-6 bg-blue-500">
      <div className="flex items-center space-x-4">
        <a className="text-white" href="/">Dogez</a>
        <a className="text-white" href="/map">Map</a>
        <a className="text-white" href="/collect">Collect</a>
        <a className="text-white" href="/stake">Stake</a>
        <a className="text-white" href="/play">Play</a>
      </div>
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
        <button id="connect-button" className="px-2 py-1 text-xs md:px-4 md:py-2 md:text-sm text-white bg-blue-700 rounded" onClick={() => { open(); }}>
          {isClient ? (address ? `Connected: ${address.slice(0, 7)}` : 'Connect Wallet') : 'Connect Wallet'}
        </button>
        <div className="flex items-center space-x-1 md:space-x-2 border border-gray-300 rounded px-1 md:px-2">
          <span className="text-white text-xs md:text-sm pr-1">{address ? balance: 0}</span>
          <span className="text-white text-xs md:text-sm">TRTZ</span>
        </div>
      </div>
    </nav>
  );
}
