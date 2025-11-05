import React, { useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ChatPanel from './components/panels/ChatPanel';
import VisionPanel from './components/panels/VisionPanel';
import ImageGenPanel from './components/panels/ImageGenPanel';
import VoicePanel from './components/panels/VoicePanel';
import { Tab } from './types';
import type { TabType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(Tab.CHAT);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.CHAT:
        return <ChatPanel />;
      case Tab.VISION:
        return <VisionPanel />;
      case Tab.IMAGE_GEN:
        return <ImageGenPanel />;
      case Tab.VOICE:
        return <VoicePanel />;
      default:
        return <ChatPanel />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
