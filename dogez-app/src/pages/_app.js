// a layout is ui that is shared between routes
// this is the root layout wrapping the core app
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { Web3Modal } from '@web3modal/react'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { mainnet, sepolia } from 'wagmi/chains'

import Navbar from '../components/Navbar';
import '../styles/globals.css'

const customChain = {
    id: 31337,
    name: process.env.NEXT_PUBLIC_CHAIN_NAME,
    network: 'ethereum',
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [process.env.NEXT_PUBLIC_RPC_URL] }
    },
    blockExplorerUrls: [],
  };

  let chains = [mainnet, sepolia];
  if (process.env.NODE_ENV !== 'production') {
    chains.push(customChain);
  }
  
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const { publicClient } = configureChains(chains, [
  w3mProvider({ projectId }),
  jsonRpcProvider({
    rpc: (chain) => ({
      http: chain.rpcUrls.default.http[0],
    }),
  })
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})

const ethereumClient = new EthereumClient(wagmiConfig, chains)

export const metadata = {
  title: '...',
}

// Wrap your app with Web3ReactProvider and pass the getLibrary function
function MyApp({ Component, pageProps }) {
  return (
    <>
        <WagmiConfig config={wagmiConfig}>
            <Navbar/>
            <Component {...pageProps} />
        </WagmiConfig>
        <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  )
}

export default MyApp
