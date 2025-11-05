import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message } from '../../types';
import MessageBox from '../MessageBox';
import LoadingSpinner from '../LoadingSpinner';
import { SendIcon } from '../Icons';

const ChatPanel: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const initializeChat = useCallback(() => {
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                alert("API key belum diatur.");
                return;
            }
            const ai = new GoogleGenAI({ apiKey });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'Anda adalah asisten AI yang ramah dan membantu bernama Omni. Jawab dalam Bahasa Indonesia.',
                },
            });
            setMessages([{ id: 'init', text: 'Halo! Saya Omni, asisten AI Anda. Ada yang bisa saya bantu?', sender: 'ai' }]);
        } catch (error) {
            console.error("Initialization error:", error);
            setMessages([{ id: 'init-error', text: 'Gagal menginisialisasi sesi obrolan.', sender: 'ai' }]);
        }
    }, []);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: input });
            let aiResponseText = '';
            const aiMessageId = Date.now().toString() + '-ai';
            
            // Add a placeholder for the AI message
            setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

            for await (const chunk of stream) {
                aiResponseText += chunk.text;
                setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: aiResponseText } : msg));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = { id: Date.now().toString() + '-error', text: 'Maaf, terjadi kesalahan.', sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800/50 rounded-lg shadow-xl">
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map(msg => <MessageBox key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-3 my-4">
                            <div className="max-w-xl p-3 rounded-lg bg-gray-700">
                                <LoadingSpinner size="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ketik pesan Anda..."
                        className="flex-1 p-3 bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;
