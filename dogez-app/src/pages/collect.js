import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { dogezABI, dogezAddress } from '../contracts/dogez'; // Replace with your actual paths
import { treatzABI, treatzAddress } from '../contracts/treatz';
import { useAccount, useBalance, useContractWrite } from 'wagmi';

function CollectPage() {
    const [web3, setWeb3] = useState(null);
    const [dogezContract, setDogezContract] = useState(null);
    const [userDogeTokens, setUserDogeTokens] = useState([]);
    const [userCosmeticTokens, setUserCosmeticTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [selectedCosmeticTokens, setSelectedCosmeticTokens] = useState([]);
    const [mintingStatus, setMintingStatus] = useState(null);
    
    const { address } = useAccount(); // Use the useAccount hook to get the current address
  
    useEffect(() => {
        const web3Instance = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
        setWeb3(web3Instance);
        initApp(web3Instance);
      }, []);
    
    const initApp = async (web3Instance) => {
        const dogezContractInstance = new web3Instance.eth.Contract(dogezABI, dogezAddress);
        setDogezContract(dogezContractInstance);
    };

    useEffect(() => {
        if (dogezContract && address) {
          fetchUserTokens();
        }
    }, [dogezContract, address]);

    const fetchUserTokens = async () => {
        try {
          const response = await fetch('/api/all-token-types');
          const data = await response.json();
          const tokens = data.data;
    
          const baseAndCustomTokens = await Promise.all(tokens.filter(token => token.type === 'base' || token.type === 'custom').map(async token => {
            const balance = await dogezContract.methods.balanceOf(address, token.id).call();
            return { ...token, balance };
          }));
          setUserDogeTokens(baseAndCustomTokens);
    
          const cosmeticTokens = await Promise.all(tokens.filter(token => token.type === 'cosmetic').map(async token => {
            const balance = await dogezContract.methods.balanceOf(address, token.id).call();
            return { ...token, balance };
          }));
          setUserCosmeticTokens(cosmeticTokens);
    
        } catch (error) {
          console.error("An error occurred while fetching tokens: ", error);
        }
    };

    const handleTokenClick = (token) => {
        if (token.type === 'base' || token.type === 'custom') {
            setSelectedToken(token);
        } else if (token.type === 'cosmetic') {
            if (selectedCosmeticTokens.includes(token)) {
                setSelectedCosmeticTokens(selectedCosmeticTokens.filter(t => t !== token));
            } else if (selectedCosmeticTokens.length < 3) {
                setSelectedCosmeticTokens([...selectedCosmeticTokens, token]);
            }
        }
    }

    const { data: treatzBalance } = useBalance({
      address: address,
      token: treatzAddress,
    });

    const handleMint = async () => {
      try {
        const costInWei = Web3.utils.toWei('500', 'ether'); // 500 Treatz

        // Check if user has enough Treatz
        if (treatzBalance.value >= costInWei) {
          // Transfer 500 Treatz to a receiving address
          const receiveAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
          transferTreatz({
            args: [receiveAddr, costInWei],
            from: address,
          });
        } else {
          alert('You do not have enough Treatz tokens to mint this Doge.');
        }
      } catch (error) {
        console.error("An error occurred while transferring Treatz: ", error);
      }
    };    

    const onSuccessfulTransfer = async () => {
      // Continue with the minting process after successful transfer
      try {
        const selectedImages = [selectedToken.image_url, ...selectedCosmeticTokens.map(token => token.image_url)];
        const response = await fetch('/api/mint-custom', { // Updated endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedImages,
            userAddress: address,
            selectedToken, // Include selectedToken
            selectedCosmeticTokens // Include selectedCosmeticTokens
          })
        });
        const data = await response.json();
        if (data.message.startsWith('Minting successful')) { // Updated condition
          setMintingStatus('success'); // Set the status to 'success'
          fetchUserTokens(); // Refresh user's tokens
        } else {
          setMintingStatus('error'); // Set the status to 'error'
        }
      } catch (error) {
        console.error("An error occurred while minting: ", error);
        setMintingStatus('error'); // Set the status to 'error'
      }
    };

    const { write: transferTreatz } = useContractWrite({
      address: treatzAddress,
      abi: treatzABI,
      functionName: 'transfer',
      onSuccess: onSuccessfulTransfer,
    });

    const handleClear = () => {
      setSelectedToken(null); // Reset selected base/custom token
      setSelectedCosmeticTokens([]); // Reset selected cosmetic tokens
      setMintingStatus(null); // Clear the minting status
    };    
        
    return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Your Tokens</h1>
    
          <div className="border p-4 mb-4 flex justify-center items-center mx-auto" style={{width: '300px', height: '300px'}}>
            {!selectedToken && <h2 className="text-xl font-bold">Builder</h2>}
            {selectedToken && (
                <img src={selectedToken.image_url} alt={selectedToken.name} style={{maxWidth: '100%', maxHeight: '100%', position: 'absolute'}} />
            )}
            {selectedCosmeticTokens.map((token, index) => (
                <img key={index} src={token.image_url} alt={token.name} style={{width: '100%', height: '100%', position: 'absolute', transform: 'scale(0.25)'}} />
            ))}
          </div>
          <div className="flex flex-col items-center mb-8">
            <div className="flex justify-center items-center">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleMint}>Mint</button>
              <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2" onClick={handleClear}>Clear</button>
            </div>
            {mintingStatus === 'success' && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-2" role="alert">
                <strong className="font-bold">Success!</strong>
                <span className="block sm:inline"> Minting was successful.</span>
              </div>
            )}
            {mintingStatus === 'error' && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-2" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> An error occurred while minting.</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {userDogeTokens.filter(token => token.balance > 0).map((token, index) => (
                <div key={index} className="border p-4" onClick={() => handleTokenClick(token)} style={{borderColor: selectedToken === token ? 'blue' : 'transparent'}}>
                <h2 className="text-xl font-bold">{token.name}</h2>
                <img src={token.image_url} alt={token.name} style={{width: '100px', height: '100px'}} />
                <p>{token.balance} of this token.</p>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
            {userCosmeticTokens.filter(token => token.balance > 0).map((token, index) => (
                <div key={index} className="border p-4" onClick={() => handleTokenClick(token)} style={{borderColor: selectedToken === token || selectedCosmeticTokens.includes(token) ? 'blue' : 'transparent'}}>
                <h2 className="text-xl font-bold">{token.name}</h2>
                <img src={token.image_url} alt={token.name} style={{width: '100px', height: '100px'}} />
                <p>{token.balance} of this token.</p>
                </div>
            ))}
        </div>
        </div>
    );
}

export default CollectPage;
