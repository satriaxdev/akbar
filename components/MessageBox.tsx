import React from 'react';
import type { Message } from '../types';

interface MessageBoxProps {
  message: Message;
}

const MessageBox: React.FC<MessageBoxProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  // A simple markdown-like renderer for newlines
  const renderText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xl p-3 rounded-2xl shadow-md ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
        <p className="text-white whitespace-pre-wrap">{renderText(message.text)}</p>
      </div>
    </div>
  );
};

export default MessageBox;
