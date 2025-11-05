import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 text-center sticky top-0 z-10">
      <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
        AI Asisten Serbaguna
      </h1>
      <p className="text-sm text-gray-400 mt-1">Ditenagai oleh Gemini</p>
    </header>
  );
};

export default Header;
