import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { LiveSession, LiveServerMessage } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../../utils/audio';

type ConnectionState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

const VoicePanel: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('IDLE');
    const [userTranscript, setUserTranscript] = useState<string>('');
    const [aiTranscript, setAiTranscript] = useState<string>('');
    const [history, setHistory] = useState<Array<{type: 'user' | 'ai', text: string}>>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const cleanUpAudio = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);
    
    const startConversation = useCallback(async () => {
        setConnectionState('CONNECTING');
        setHistory([]);
        setUserTranscript('');
        setAiTranscript('');

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API key not found");
            
            const ai = new GoogleGenAI({ apiKey });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'Anda adalah Omni, asisten suara AI yang sangat ramah dan suka membantu. Selalu jawab dalam Bahasa Indonesia.',
                },
                callbacks: {
                    onopen: () => {
                        setConnectionState('CONNECTED');
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setUserTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
                        }
                        if (message.serverContent?.outputTranscription) {
                            setAiTranscript(prev => prev + message.serverContent!.outputTranscription!.text);
                        }
                        if (message.serverContent?.turnComplete) {
                            setHistory(prev => [...prev, {type: 'user', text: userTranscript}, {type: 'ai', text: aiTranscript}]);
                            setUserTranscript('');
                            setAiTranscript('');
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            const outputCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => { setConnectionState('DISCONNECTED'); cleanUpAudio(); },
                    onerror: (e) => { console.error(e); setConnectionState('ERROR'); cleanUpAudio(); },
                },
            });

        } catch (error) {
            console.error('Failed to start conversation:', error);
            setConnectionState('ERROR');
            cleanUpAudio();
        }
    }, [userTranscript, aiTranscript, cleanUpAudio]);

    const stopConversation = useCallback(async () => {
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }
        cleanUpAudio();
        setConnectionState('IDLE');
    }, [cleanUpAudio]);
    
    useEffect(() => {
        return () => {
            stopConversation();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderStatus = () => {
        switch (connectionState) {
            case 'IDLE': return 'Klik untuk memulai percakapan';
            case 'CONNECTING': return 'Menghubungkan...';
            case 'CONNECTED': return 'Terhubung! Silakan berbicara.';
            case 'DISCONNECTED': return 'Percakapan berakhir.';
            case 'ERROR': return 'Terjadi kesalahan koneksi.';
        }
    }

    return (
        <div className="flex flex-col h-full items-center p-4 bg-gray-800/50 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold mb-2 text-blue-300">Percakapan Suara AI</h2>
            <p className="text-gray-400 mb-4 text-center">{renderStatus()}</p>

            <div className="mb-6">
                <button
                    onClick={connectionState === 'CONNECTED' ? stopConversation : startConversation}
                    disabled={connectionState === 'CONNECTING'}
                    className={`px-8 py-4 rounded-full text-white font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50
                        ${connectionState === 'CONNECTED' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'}
                        ${connectionState === 'CONNECTING' ? 'bg-gray-600 cursor-not-allowed animate-pulse' : ''}`}
                >
                    {connectionState === 'CONNECTED' ? 'Hentikan Percakapan' : 'Mulai Percakapan'}
                </button>
            </div>

            <div className="w-full flex-1 bg-gray-900/50 rounded-lg p-4 overflow-y-auto space-y-4">
                {history.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${item.type === 'user' ? 'bg-blue-900/50' : 'bg-gray-700/50'}`}>
                        <span className="font-bold text-sm uppercase">{item.type === 'user' ? 'Anda' : 'Omni'}: </span>
                        {item.text}
                    </div>
                ))}
                {userTranscript && (
                    <div className="p-3 rounded-lg bg-blue-900/50 opacity-75">
                         <span className="font-bold text-sm uppercase">Anda: </span>{userTranscript}
                    </div>
                )}
                 {aiTranscript && (
                    <div className="p-3 rounded-lg bg-gray-700/50 opacity-75">
                        <span className="font-bold text-sm uppercase">Omni: </span>{aiTranscript}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoicePanel;
