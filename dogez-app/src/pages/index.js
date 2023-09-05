// pages/index.js
import { useState } from 'react'
import { treatzAddress } from '../contracts/treatz'
import { useWalletClient, useAccount } from 'wagmi'
import { switchNetwork } from '@wagmi/core'

export default function Home() {
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  async function switchToSepolia() {
    try {
      const network = await switchNetwork({
        chainId: 11155111,
      })
      console.log("Switched to", network)
    } catch (err) {
        console.log(err);
    }
  }

  async function addToken() {
    try {
      await walletClient.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: treatzAddress,
            symbol: 'TRTZ',
            decimals: 18,
            image: null,
          },
        },
      });
    } catch (err) {
      setError(err.message)
    }
  }

  async function getTokens() {
    const response = await fetch('/api/faucet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: address }),
    })
    const data = await response.json()
    setMessage(data.message)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="guide text-center p-4 bg-blue-100 rounded-lg shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-blue-800">Welcome to Dogez!</h2>
        <div className="p-4 mx-auto bg-white rounded shadow-inner max-w-prose">
          <ol className="list-decimal list-inside text-left text-blue-700">
            <li>Install <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-red-600 underline">Metamask</a> wallet</li>
            <li>Connect your wallet</li>
            <li>
              <button onClick={switchToSepolia} className="mt-4 px-2 md:px-4 py-1 text-xs md:text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700">Switch to the Sepolia TestNet</button>
            </li>
            <li>
              <button onClick={addToken} className="mt-4 px-2 md:px-4 py-1 text-xs md:text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700">Add the Treatz token contract to your wallet</button>
            </li>
            <li>
              Get some Sepolia ETH for transactions! Use one of the following sources:
              <div className="mt-4">
                <a href="https://sepolia-faucet.pk910.de/#/" 
                  className="my-2 text-blue-600 hover:underline block underline"
                  target="_blank" 
                  rel="noopener noreferrer">
                  Sepolia Faucet by pk910
                </a>
                <a href="https://www.infura.io/faucet/sepolia" 
                  className="my-2 text-blue-600 hover:underline block underline"
                  target="_blank" 
                  rel="noopener noreferrer">
                  Infura Sepolia Faucet
                </a>
              </div>
            </li>
            <li>
              Get some Treatz using the button at the bottom of the page! Please don't request too many Treatz.
            </li>
          </ol>
          <p className="mt-4 text-blue-700">Now you're ready to collect some Dogez!</p>
          <p className="mt-4 text-blue-700">Explore, have fun, and welcome to the community.</p>
          <p className="mt-4 text-blue-700">For more instructions please check out the <a href="/faq" className="underline hover:text-blue-900">FAQ</a>.</p>
          <p className="mt-4 text-blue-700">And please visit our <a href="https://discord.gg/FMjrpdHRm5" className="underline hover:text-blue-900" target="_blank" rel="noopener noreferrer">Discord</a> to leave some feedback!</p>
        </div>
      </div>
      <div className="faucet mt-8 text-center">
        <button onClick={getTokens} className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-lg font-bold text-white bg-green-500 rounded hover:bg-green-600">Get Some Treatz!</button>
        <div className="mt-4 text-green-700">{message}</div>
      </div>
      {error && <p className="mt-4 text-center text-red-500">Error: {error}</p>}
    </div>
  ); 
}
