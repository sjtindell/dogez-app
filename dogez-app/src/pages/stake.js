import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { dogezABI, dogezAddress } from '../contracts/dogez';
import { stakerABI, stakerAddress } from '../contracts/staker';
import { useAccount } from 'wagmi';
import { writeContract } from '@wagmi/core';

export default function StakePage() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [userAddress, setUserAddress] = useState('');
  const [dogezContract, setDogezContract] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [totalUnstakedNFTs, setTotalUnstakedNFTs] = useState(0);
  const [totalStakedNFTs, setTotalStakedNFTs] = useState(0);
  const [rewards, setRewards] = useState(0);
  const [userNFTs, setUserNFTs] = useState([]);
  const [tokenTypes, setTokenTypes] = useState([]);
  
  const { address } = useAccount();

  useEffect(() => {
    const web3Instance = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
    setWeb3(web3Instance);
    initApp(web3Instance);
  }, []);

  useEffect(() => {
    if (dogezContract && stakingContract && userAddress && tokenTypes.length > 0) {
      updateDisplay(dogezContract, stakingContract, userAddress);
      const intervalId = setInterval(() => {
        updateDisplay(dogezContract, stakingContract, userAddress);
      }, 10000);
      return () => clearInterval(intervalId); // Clear interval on unmount
    }
  }, [dogezContract, stakingContract, userAddress, tokenTypes]);

  const initApp = async (web3Instance) => {
    try {

      setUserAddress(address);

      const dogezContractInstance = new web3Instance.eth.Contract(dogezABI, dogezAddress);
      setDogezContract(dogezContractInstance);

      const stakingContractInstance = new web3Instance.eth.Contract(stakerABI, stakerAddress);
      setStakingContract(stakingContractInstance);

      const tokenTypes = await fetchTokenTypes();
      setTokenTypes(tokenTypes);

    } catch (error) {
      console.error("An error occurred while updating balances: ", error);
    }
  };

  const updateDisplay = async (dogezContractInstance, stakingContractInstance, account) => {
    updateBalances(dogezContract, stakingContract, userAddress);
    updateNFTsDisplay();
  }

  const fetchTokenTypes = async () => {
    // Replace with your actual API endpoint
    const response = await fetch('/api/token-types');
    const responseData = await response.json();
    const data = responseData.data;  // Access the 'data' property of the response data

    // Filter out the cosmetic tokens
    const baseAndCustomTokens = data.filter(token => token.type === 'base' || token.type === 'custom');
    return baseAndCustomTokens
  };

  const updateBalances = async (dogezContractInstance, stakingContractInstance, account) => {
    try {
      const web3Instance = new Web3(process.env.NEXT_PUBLIC_RPC_URL);

      // Fetch and display the user's unstaked DOGEZ
      const stakedTokensOwned = await stakingContractInstance.methods.getStakedTokensByOwner(account).call();

      let totalBaseAndCustomTokens = 0;
      for (const tokenType of tokenTypes) {
        const balance = await dogezContractInstance.methods.balanceOf(account, tokenType.id).call();
        totalBaseAndCustomTokens += Number(balance);
      }

      setTotalUnstakedNFTs(totalBaseAndCustomTokens);
      setTotalStakedNFTs(stakedTokensOwned.length);

      // Fetch and display the user's staked DOGEZ and rewards
      let rewards = 0;
      for (const tokenId of stakedTokensOwned) {
        const amount = await stakingContractInstance.methods.getStake(tokenId, account).call();
        const reward = await stakingContractInstance.methods.calculateReward(tokenId, account).call();
        rewards += Number(web3Instance.utils.fromWei(reward, 'ether')) * amount;  // Convert Wei to Ether (assumes 18 decimals)
      }
      setRewards(rewards);

    } catch (error) {
      console.error("An error occurred while updating balances: ", error);
    }
  };


  const updateNFTsDisplay = async () => {
    try {
      // Fetch both unstaked and staked NFTs of each token type
      let fetchedNFTs = [];
      const stakedTokensOwned = await stakingContract.methods.getStakedTokensByOwner(userAddress).call();
      for (const tokenId of stakedTokensOwned) {
        const tokenType = tokenTypes.find(type => type.id === Number(tokenId)); // Assuming tokenTypes is an array of all token types
        if (tokenType) {
          const imgURL = tokenType.image_url;
          const tokenName = tokenType.name;
  
          // check if tokens are staked
          const isStaked = true;
  
          fetchedNFTs.push({ tokenId, imgURL, isStaked, tokenName });
        }
      }
  
      for (const tokenType of tokenTypes) {
        const balance = await dogezContract.methods.balanceOf(userAddress, tokenType.id).call();
        const stake = await stakingContract.methods.getStake(tokenType.id, userAddress).call();
        const unstakedAmount = balance - stake;
      
        for (let i = 0; i < balance; i++) {
          const tokenId = tokenType.id;
          const imgURL = tokenType.image_url;
          const tokenName = tokenType.name;
          const isStaked = stakedTokensOwned.includes(tokenId); // Check if the token is in the stakedTokensOwned array
      
          fetchedNFTs.push({ tokenId, imgURL, isStaked, tokenName });
        }
      }      
  
      setUserNFTs(fetchedNFTs);
  
    } catch (error) {
      console.error("An error occurred while updating balances: ", error);
    }
  };     
  

  const stakeAll = async () => {
    for (const tokenType of tokenTypes) {
        const balance = await dogezContract.methods.balanceOf(userAddress, tokenType.id).call();
        if (balance > 0) {
            await writeContract({
                address: dogezAddress,
                abi: dogezABI,
                functionName: 'setApprovalForAll',
                args: [stakerAddress, true],
            });
            for (let i = 0; i < balance; i++) {
                await writeContract({
                    address: stakerAddress,
                    abi: stakerABI,
                    functionName: 'stake',
                    args: [tokenType.id, 1],
                });
            }
        }
    }
    updateBalances(dogezContract, stakingContract, userAddress);
    updateNFTsDisplay();
  };    

  const withdrawRewards = async () => {
    const stakedTokensOwned = await stakingContract.methods.getStakedTokensByOwner(userAddress).call();
    for (let i = 0; i < stakedTokensOwned.length; i++) {
      //await stakingContract.methods.claimRewards(stakedTokensOwned[i]).send({from: userAddress});
      const { claimRewardsHash } = await writeContract({
        address: stakerAddress,
        abi: stakerABI,
        functionName: 'claimRewards',
        args: [stakedTokensOwned[i]],
      })
    }
    updateBalances(dogezContract, stakingContract, userAddress);
  };

  const withdrawAll = async () => {
    const stakedTokensOwned = await stakingContract.methods.getStakedTokensByOwner(userAddress).call();
    for(let i = 0; i < stakedTokensOwned.length; i++) {
        const tokenId = stakedTokensOwned[i];
        const amount = await stakingContract.methods.getStake(tokenId, userAddress).call();
        if (amount > 0) {
            for (let j = 0; j < amount; j++) {
                await writeContract({
                    address: stakerAddress,
                    abi: stakerABI,
                    functionName: 'withdraw',
                    args: [tokenId, 1],
                });
            }
        }
    }
    updateBalances(dogezContract, stakingContract, userAddress);
    updateNFTsDisplay();
  }; 

  const handleStakeUnstake = async (nft, amount) => {
    if (nft.isStaked) {
      const { withdrawHash } = await writeContract({
        address: stakerAddress,
        abi: stakerABI,
        functionName: 'withdraw',
        args: [nft.tokenId, amount],
      })
    } else {
      const { approveHash } = await writeContract({
        address: dogezAddress,
        abi: dogezABI,
        functionName: 'setApprovalForAll',
        args: [stakerAddress, true],
      })
      const { stakeHash } = await writeContract({
        address: stakerAddress,
        abi: stakerABI,
        functionName: 'stake',
        args: [nft.tokenId, amount],
      })
    }
    updateBalances(dogezContract, stakingContract, userAddress);
    updateNFTsDisplay();
  };  

  const renderNFTs = () => {
    return userNFTs.map((nft, index) => (
      <div key={index} className='flex flex-col items-center m-4 md:m-8'>
        <img className={`w-24 h-24 md:w-36 md:h-36 border-2 ${nft.isStaked ? 'border-green-500' : 'border-white'}`} src={nft.imgURL} alt={`NFT ${nft.tokenId}`} />
        <div className='flex justify-between w-full mt-2 md:mt-4'>
          <span>type: {nft.tokenName}</span>
          <button className="px-2 py-1 font-bold text-white bg-blue-600 rounded hover:bg-blue-700" onClick={() => handleStakeUnstake(nft, 1)}>
            {nft.isStaked ? 'Unstake' : 'Stake'}
          </button>
        </div>
      </div>
    ));
  };  

return (
    <div className="p-4 m-4 md:p-8 md:m-8">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-8">
        <div className="flex-1 text-center p-4 border border-black">
          <h2 className="text-xl md:text-2xl font-bold">Staked:</h2>
          <p className="text-4xl md:text-6xl">{totalStakedNFTs} Dogez</p>
          <button className="mt-2 px-2 py-1 md:mt-4 md:px-4 md:py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700" onClick={withdrawAll}>Withdraw All</button>
        </div>

        <div className="flex-1 text-center p-4 border border-black">
          <h2 className="text-xl md:text-2xl font-bold">Unstaked:</h2>
          <p className="text-4xl md:text-6xl">{totalUnstakedNFTs} Dogez</p>
          <button className="mt-2 px-2 py-1 md:mt-4 md:px-4 md:py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700" onClick={stakeAll}>Stake All</button>
        </div>
        
        <div className="flex-1 text-center p-4 border border-black">
          <h2 className="text-xl md:text-2xl font-bold">Rewards:</h2>
          <p className="text-4xl md:text-6xl">{rewards} Treatz</p>
          <button className="mt-2 px-2 py-1 md:mt-4 md:px-4 md:py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700" onClick={withdrawRewards}>Claim</button>
        </div>
      </div>

      <div className="flex flex-wrap justify-start pl-4 pr-4 md:pl-8 md:pr-8">
        {renderNFTs()}
      </div>
    </div>
);
}
