import React from 'react';
import { Tab } from '../types';
import type { TabType } from '../types';
import { ChatIcon, EyeIcon, ImageIcon, MicrophoneIcon } from './Icons';

interface TabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const tabOptions = [
  { id: Tab.CHAT, label: 'Obrolan', icon: <ChatIcon /> },
  { id: Tab.VISION, label: 'Visi', icon: <EyeIcon /> },
  { id: Tab.IMAGE_GEN, label: 'Generator Gambar', icon: <ImageIcon /> },
  { id: Tab.VOICE, label: 'Suara', icon: <MicrophoneIcon /> },
];

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex justify-center border-b border-gray-700 bg-gray-800/30">
      <div className="flex space-x-2 sm:space-x-4 px-2">
        {tabOptions.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-3 text-sm sm:text-base font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-t-lg
              ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-400 text-blue-300'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Tabs;
