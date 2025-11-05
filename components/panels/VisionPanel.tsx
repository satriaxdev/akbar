import React, { useState, useCallback } from 'react';
import { generateTextFromImage } from '../../services/geminiService';
import LoadingSpinner from '../LoadingSpinner';
import { UploadIcon } from '../Icons';

const VisionPanel: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [response, setResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setError('');
            setResponse('');
        }
    };

    const fileToGenerativePart = useCallback(async (file: File): Promise<{mimeType: string, data: string}> => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            mimeType: file.type,
            data: await base64EncodedDataPromise,
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !prompt.trim()) {
            setError('Harap unggah gambar dan masukkan pertanyaan.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResponse('');

        try {
            const { mimeType, data } = await fileToGenerativePart(image);
            const result = await generateTextFromImage(prompt, data, mimeType);
            setResponse(result);
        } catch (err) {
            console.error(err);
            setError('Gagal mendapatkan respons dari AI. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full items-center p-4 bg-gray-800/50 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">Analisis Gambar dengan AI</h2>
            
            <div className="w-full max-w-lg mb-4">
                <label htmlFor="image-upload" className="cursor-pointer block w-full p-6 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-blue-400 hover:bg-gray-700/50 transition-colors">
                    {preview ? (
                        <img src={preview} alt="Pratinjau" className="max-h-48 mx-auto rounded-md" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                           <UploadIcon/>
                            <p>Klik untuk mengunggah gambar</p>
                            <p className="text-xs">(PNG, JPEG, WEBP)</p>
                        </div>
                    )}
                </label>
                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Apa yang ingin Anda tanyakan tentang gambar ini?"
                    className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                    rows={3}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !image || !prompt.trim()}
                    className="w-full p-3 bg-blue-600 rounded-md text-white font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {isLoading ? 'Menganalisis...' : 'Tanyakan pada AI'}
                </button>
            </form>

            {error && <p className="mt-4 text-red-400">{error}</p>}
            
            {(isLoading || response) && (
              <div className="w-full max-w-lg mt-6 p-4 bg-gray-700/50 rounded-lg overflow-y-auto flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-blue-300">Jawaban AI:</h3>
                  {isLoading ? (
                      <div className="flex justify-center items-center h-24">
                          <LoadingSpinner />
                      </div>
                  ) : (
                      <p className="text-gray-200 whitespace-pre-wrap">{response}</p>
                  )}
              </div>
            )}
        </div>
    );
};

export default VisionPanel;
