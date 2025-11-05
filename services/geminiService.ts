import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const getGenAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey });
}

export const generateTextFromImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const ai = getGenAI();
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType,
            },
        };
        const textPart = {
            text: prompt,
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating text from image:", error);
        return "Maaf, terjadi kesalahan saat menganalisis gambar.";
    }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const ai = getGenAI();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};
