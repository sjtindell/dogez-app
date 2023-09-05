import React from 'react';

const Play = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to the Dogepark</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/play/flappy" className="bg-white rounded-md shadow-md p-8 flex flex-col items-center justify-center md:h-[240px]">
            <h2 className="text-2xl font-semibold mb-4">Flappy Dogez</h2>
            <p className="text-gray-600">Help your Doge navigate through obstacles to earn Treatz!</p>
          </a>
          <div className="bg-white rounded-md shadow-md p-8 flex flex-col items-center justify-center md:h-[240px]">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
            <p className="text-gray-600">New Game</p>
          </div>
          <div className="bg-white rounded-md shadow-md p-8 flex flex-col items-center justify-center md:h-[240px]">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
            <p className="text-gray-600">New Game</p>
          </div>
          {/* Add more game options in a similar manner */}
        </div>
      </div>
    </div>
  );
};

export default Play;
