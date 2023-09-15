import React from 'react';

export default function FaqPage() {
  const faqs = [
    {
      question: 'How do I collect some Dogez?',
      answerSections: [
        {
          text: 'First navigate to the Map, you should see some Dogez and cosmetics near you.',
          imageUrl: '/images/faq/MapScreenshot.png',
        },
        {
          text: 'Next, get close to the Dogez or cosmetics and tap them! If you are too far away you will see an alert.',
          imageUrl: '/images/faq/DogeToCatchScreenshot.png',
        },
        {
          text: 'Click the button and you will get a transaction to pay some Treatz',
          imageUrl: '/images/faq/TransactionScreenshot.png',
        },
        {
          text: 'Once the transaction completes and is mined on the blockchain, you should see what you got. You own those NFTs!',
          imageUrl: '/images/faq/CaughtDogeScreenshot.png',
        },
        {
          text: 'Collect some cosmetics for your Doge, then browse to the Collect page. Combine the dogez and cosmetics to mint fun new NFTS!',
          imageUrl: '/images/faq/DogeCraftingScreenshot.png',
        },
        {
          text: 'Once you click mint, you should pay another transaction and you will see success! Your new custom doge will show up on the Collect page and elsewhere in the app.',
          imageUrl: '/images/faq/CraftedDogeScreenshot.png',
        },
        {
          text: 'Try to collect more cosmetics! Your base and custom dogez can be used for Staking and Play in the app.',
          imageUrl: '/images/faq/FullDogeCraftingScreenshot.png',
        },
      ],
    },
    {
      question: 'The transactions fail or hang for a long time?',
      answer: 'You will need to have both Treatz and Sepolia ETH in your wallet. Follow the main page instructions. This is also a blockchain app - it will take time from when you press a butotn to when a transaction is mined for the operation to complete.',
    },
    {
      question: 'What can I do with my Dogez?',
      answer: 'You can do all the NFT basics, you own your Dogez now - you can admire them, collect more, or even send them to your friends! Here on the dogez app, you can:',
      list: [
        'Accessorize your dogez and create custom, one of a kind NFTs using the Collect page.',
        'Stake your dogez. Browse to the Stake page, select one or more dogez, and stake them. You will not be able to use your dogez, but you will collect rewards every 24 hours. You can unstake them or claim your rewards any time.',
        'Play games with your dogez. Go to Play! Right now we support Flappy Dogez, where you can choose one of your dogez, guide it through the maze of obstacles, and collect more treatz! Have fun!',
      ],
    },    
    {
      question: 'When I click the Add Token and Get Treatz buttons on the landing page, nothing happens or my transactions are stuck in pending state.',
      answer: 'Dogez is still in development, so sometimes we deploy a new version of the app or redeploy the contracts for testing. Try the following steps:',
      steps: [
        'Disconnect your Wallet by clicking the top right Connected button and selecting "Disconnect" on the Modal',
        'Go to your MetaMask Wallet -> Settings -> Advanced, and clear your activity to reset your account nonce',
        'Refresh the page, Connect your wallet, and try adding the token/swapping to Sepolia network again before trying to get some Treatz',
      ],
    },
    {
      question: 'When I browse to the Map page, it\'s blank.',
      answer: 'The first time you visit the Map page, it should prompt you and ask for permission to track your location. Try enabling location services on your browser/device.',
    },
    {
        question: 'What browsers can I use for Dogez?',
        answer: 'Any browser (Safari, Chrome, Firefox, Brave) should work as long as it has geolocation services. Dogez should work on Desktop or mobile. For a little bit smoother experience, try the MetaMask Wallet Browser. Unfortunately the company that develops that browser only supports geolocation serices on iOS currently.'
    },
    {
        question: 'Are these Dogez and Treatz official yet?',
        answer: "We are still testing. We have setup a custom ipfs node, deployed to the test net, and are using generic stand-in art for now. Eventually we will be running on the Ethereum mainnet, with custom art and a Treatz token tradeable on Liquidity Pools. Everyone who participates in testing and gives feedback in the Discord will receive a limited edition Doge! Thanks for your patience, and thanks for helping test out Dogez!"
    }
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Frequently Asked Questions</h1>
      {faqs.map((faq, index) => (
        <div key={index} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{faq.question}</h2>
          {faq.answerSections ? (
            faq.answerSections.map((section, i) => (
              <div key={i}>
                <p className="text-gray-700 mb-2">{section.text}</p>
                <img src={section.imageUrl} alt={`Instruction ${i + 1}`} style={{ width: '200px', height: 'auto' }} className="my-2" />
              </div>
            ))
          ) : (
            <p className="text-gray-700">{faq.answer}</p>
          )}
          {faq.list && (
            <ol className="list-decimal list-inside text-gray-700 pl-5">
              {faq.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          )}
          {faq.steps && (
            <ol className="list-decimal list-inside text-gray-700 pl-5">
              {faq.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}
