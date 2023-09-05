import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stage, Sprite, Container, usePixiTicker, Text } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import { useAccount } from 'wagmi'; 
import { dogezABI, dogezAddress } from '../../contracts/dogez';
import Web3 from 'web3';

const GRAVITY = 0.3; // Adjust this to change the speed of falling
const JUMP_STRENGTH = -6; // Adjust this to change the strength of jumps
const OBSTACLE_WIDTH = 50; // The width of the obstacles
const OBSTACLE_GAP = 200; // The gap between the obstacles
const DESKTOP_OBSTACLE_COUNT = 3; // The number of obstacles for desktop
const MOBILE_OBSTACLE_COUNT = 5; // The number of obstacles for mobile
const OBSTACLE_SPEED = 4; // The speed at which the obstacles move

function intersects(box1, box2) {
  return box1.x < box2.x + box2.width &&
         box2.x < box1.x + box1.width &&
         box1.y < box2.y + box2.height &&
         box2.y < box1.y + box1.height;
}

const Player = ({ y, setY, velocity, setVelocity, gameStarted, setGameStarted, checkCollision, selectedNFT }) => {
  const texture = PIXI.Texture.from(selectedNFT.imgURL);
  const yRef = useRef(y); // Create a ref to store the y value

  // Update the ref whenever y changes
  useEffect(() => {
    yRef.current = y;
  }, [y]);

  const handleJump = () => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    setVelocity(JUMP_STRENGTH);
  };

  // Remove the checkCollision call from here
  useEffect(() => {
    const jump = () => {
      handleJump();
    };

    window.addEventListener('click', jump);
    window.addEventListener('touchstart', jump);
    return () => {
      window.removeEventListener('click', jump);
      window.removeEventListener('touchstart', jump);
    };
  }, [gameStarted, setGameStarted]);

  const animate = useCallback((delta) => {
    if (gameStarted) {
      setVelocity((v) => v + GRAVITY * delta);
      setY((y) => {
        const newY = y + velocity * delta;
        checkCollision({ x: 100, y: newY, width: 50, height: 50 }); // Check for collisions with the player's bounding box
        return newY;
      });
    }
  }, [velocity, gameStarted, setVelocity, setY, checkCollision]);

  usePixiTicker(animate); // Add this line back

  return (
    <Sprite
      texture={texture}
      x={100}
      y={y}
      width={50}
      height={50}
      interactive={true}
      touchstart={handleJump}
    />
  );
};


const Obstacle = ({ id, x, gapY, gapHeight, windowHeight, coinCollected }) => {
  const texture = id % 3 === 0 ? PIXI.Texture.from("/images/coins.png") : PIXI.Texture.EMPTY;
  const spriteSize = 50; // Adjust the size of the sprite

  return (
    <Container>
      {!coinCollected && (
        <Sprite
          texture={texture}
          x={x}
          y={gapY + gapHeight / 2}
          anchor={[0.5, 0.5]}
          scale={[spriteSize / texture.width, spriteSize / texture.height]}
        />
      )}
      <Sprite texture={PIXI.Texture.WHITE} x={x} y={0} width={OBSTACLE_WIDTH} height={gapY} />
      <Sprite texture={PIXI.Texture.WHITE} x={x} y={gapY + gapHeight} width={OBSTACLE_WIDTH} height={windowHeight - gapY - gapHeight} />
    </Container>
  );
};


function Game() {
  const [dimensions, setDimensions] = useState({
    width: 800, // Initial width
    height: 600, // Initial height
  });
  const [playerY, setPlayerY] = useState(dimensions.height / 2);
  const [velocity, setVelocity] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [obstacleCounter, setObstacleCounter] = useState(0); // Counter for assigning unique IDs to obstacles
  const [score, setScore] = useState(0); // Score counter
  const [isClient, setIsClient] = useState(false); // State variable to track if rendering on client
  const { address } = useAccount(); // Get the user's address
  const [userNFTs, setUserNFTs] = useState([]); // State variable to store the user's NFTs
  const [selectedNFT, setSelectedNFT] = useState(null); // State variable to store the selected NFT
  const [isLandscape, setIsLandscape] = useState(false);

  const web3Instance = new Web3(process.env.NEXT_PUBLIC_RPC_URL);
  const dogezContract = new web3Instance.eth.Contract(dogezABI, dogezAddress);


  useEffect(() => {
    // Since this runs only after render, it will only run on the client side
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Function to update the isLandscape state based on the window dimensions
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    handleResize();

    // Add event listener for resize events
    window.addEventListener('resize', handleResize);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (address) {
      getNFTs();
    }
  }, [address]);

  const getNFTs = async () => {
    try {
      let fetchedNFTs = [];
  
      const tokenTypes = await fetchTokenTypes();
  
      for (const tokenType of tokenTypes) {
        const balance = await dogezContract.methods.balanceOf(address, tokenType.id).call();
  
        for (let i = 0; i < balance; i++) {
          const tokenId = tokenType.id;
          const imgURL = tokenType.image_url;
          const tokenName = tokenType.name;
          const isStaked = false;
  
          fetchedNFTs.push({ tokenId, imgURL, isStaked, tokenName });
        }
      }
  
      setUserNFTs(fetchedNFTs);
  
    } catch (error) {
      console.error("An error occurred while getting userNFTs: ", error);
    }
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

  const handleNFTClick = (nft) => {
    setSelectedNFT(nft);
    handleGameStart();
  };

  const transferTreatz = async (amount) => {
    if (amount < 1) {
      console.log('Amount is less than 1. No transaction will be sent.');
      return;
    }
  
    try {
      const response = await fetch('/api/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          treatzCollected: amount,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error);
      }
      console.log(data.message);
      console.log('Transaction receipt:', data.txReceiptTreatz);
    } catch (error) {
      console.error('An error occurred while transferring Treatz:', error);
    }
  };
    

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateDimensions = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  useEffect(() => {
    setPlayerY(dimensions.height / 2);
  }, [dimensions.height]);

  const handleGameStart = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setPlayerY(dimensions.height / 2);
      setVelocity(JUMP_STRENGTH);
      setObstacles([]);
    }
  };

  useEffect(() => {
    const jump = () => {
      if (!gameStarted) {
        handleGameStart();
      }
    };
  
    window.addEventListener('click', jump);
    window.addEventListener('touchstart', jump);
    return () => {
      window.removeEventListener('click', jump);
      window.removeEventListener('touchstart', jump);
    };
  }, [handleGameStart, gameStarted]);

  useEffect(() => {
    if (playerY > dimensions.height) {
      // Reset the game
      setGameStarted(false);
      transferTreatz(score); // Transfer the Treatz
      setScore(0); // Reset the score
    }
  }, [playerY, dimensions.height]);

  useEffect(() => {
    if (gameStarted) {
      const obstacleSpacing = dimensions.width / (dimensions.width < 768 ? MOBILE_OBSTACLE_COUNT : DESKTOP_OBSTACLE_COUNT);

      const initialObstacles = Array.from(
        { length: dimensions.width < 768 ? MOBILE_OBSTACLE_COUNT : DESKTOP_OBSTACLE_COUNT },
        (_, i) => {
          const gapY = Math.random() * (dimensions.height - OBSTACLE_GAP);
          const x = dimensions.width + obstacleSpacing * (i + 1);
          return { id: i + 1, x, gapY, gapHeight: OBSTACLE_GAP, coinCollected: false };
        }
      );

      setObstacleCounter(initialObstacles.length); // Set the counter to the number of initial obstacles
      setObstacles(initialObstacles);
    }
  }, [gameStarted, dimensions]);

  useEffect(() => {
    if (gameStarted) {
      const obstacleSpacing = dimensions.width / (dimensions.width < 768 ? MOBILE_OBSTACLE_COUNT : DESKTOP_OBSTACLE_COUNT);

      const intervalId = setInterval(() => {
        setObstacles((obstacles) => {
          const newObstacles = obstacles
            .map((o) => {
              o.x -= OBSTACLE_SPEED;
              return o;
            })
            .filter((o) => o.x + OBSTACLE_WIDTH > 0);

          // Check if we need to add a new obstacle
          if (newObstacles.length < (dimensions.width < 768 ? MOBILE_OBSTACLE_COUNT : DESKTOP_OBSTACLE_COUNT)) {
            const lastObstacleX = newObstacles.length > 0 ? newObstacles[newObstacles.length - 1].x : dimensions.width;
            const obstacleIndex = obstacleCounter + 1; // Increment the counter to generate a new unique ID
            const newObstacleX = lastObstacleX + obstacleSpacing;
            const gapY = Math.random() * (dimensions.height - OBSTACLE_GAP);
            const gapHeight = OBSTACLE_GAP;
            newObstacles.push({ id: obstacleIndex, x: newObstacleX, gapY, gapHeight, coinCollected: false });
            setObstacleCounter(obstacleIndex); // Update the counter with the new ID
          }

          return newObstacles;
        });
      }, 20); // Update every 20ms for smooth animation

      return () => clearInterval(intervalId); // Clean up on unmount
    }
  }, [gameStarted, dimensions, obstacleCounter]);

  const removeCoin = useCallback((id) => {
    setObstacles(obstacles => obstacles.map(o => {
      if (o.id === id && !o.coinCollected) { // Check if the coin has not been collected
        setScore(score => score + 1); // Increment the score
        return { ...o, coinCollected: true };
      }
      return o;
    }));
  }, [setObstacles]);

  const checkCollision = useCallback((playerBox) => {
    obstacles.forEach((o) => {
      // Check for collision with coin
      if (o.id % 3 === 0) { 
        const coinBox = { x: o.x, y: o.gapY + o.gapHeight / 2, width: 50, height: 50 };
        if (intersects(playerBox, coinBox)) {
          removeCoin(o.id);
        }
      }
  
      // Check for collision with obstacle
      const obstacleBoxTop = { x: o.x, y: 0, width: OBSTACLE_WIDTH, height: o.gapY };
      const obstacleBoxBottom = { x: o.x, y: o.gapY + o.gapHeight, width: OBSTACLE_WIDTH, height: dimensions.height - o.gapY - o.gapHeight };
      if (intersects(playerBox, obstacleBoxTop) || intersects(playerBox, obstacleBoxBottom)) {
        setGameStarted(false); // End the game
        transferTreatz(score); // Transfer the Treatz
        setScore(0); // Reset the score
      }
    });
  }, [obstacles, removeCoin, dimensions.height]);

  if (!isClient) {
    return null; // or a loading spinner, etc.
  }

  if (!isLandscape) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Please turn your device to landscape mode to play.</p>
      </div>
    );
  }
  
  if (!address) {
    return (
      <div className="w-full h-screen mx-auto mt-[calc(-5vh+64px)] border border-black relative overflow-hidden min-h-full">
        <p>Please connect your wallet to play the game.</p>
      </div>
    );
  }  

  if (userNFTs.length === 0) {
    return (
      <div className="w-full h-screen mx-auto mt-[calc(-5vh+64px)] border border-black relative overflow-hidden min-h-full">
        <p>Collect some Dogez in order to play!</p>
      </div>
    );
  }
  
  if (!selectedNFT) {
    return (
      <div className="w-full h-screen mx-auto mt-[calc(-5vh+64px)] border border-black relative overflow-auto min-h-full">
      <p>Select an NFT to play with:</p>
      <div className="grid grid-cols-3 gap-4 overflow-auto h-full">
        {userNFTs.map(nft => (
          <div key={nft.tokenId} onClick={() => handleNFTClick(nft)} className="flex flex-col items-center">
            <img src={nft.imgURL} alt={`NFT ${nft.tokenId}`} className="w-24 h-24 object-cover" />
            <p className="mt-2">type: {nft.tokenName}</p>
          </div>
        ))}
      </div>
    </div>
    );
  }
  
  return (
    <div className="w-full h-screen mx-auto mt-[calc(-5vh+64px)] border border-black relative overflow-hidden min-h-full">
      <Stage
        options={{
          backgroundColor: 0x1099bb,
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        <Player y={playerY} setY={setPlayerY} velocity={velocity} setVelocity={setVelocity} gameStarted={gameStarted} setGameStarted={setGameStarted} checkCollision={checkCollision} selectedNFT={selectedNFT} />
        {obstacles.map((o, i) => (
          <Obstacle
            key={i}
            id={o.id}
            x={o.x}
            gapY={o.gapY}
            gapHeight={o.gapHeight}
            windowHeight={dimensions.height}
            coinCollected={o.coinCollected}
          />
        ))}
        <Text text={`Score: ${score}`} style={{ fill: 0xffffff, fontSize: 24 }} x={10} y={10} />
      </Stage>
    </div>
  );    
}

export default Game;
