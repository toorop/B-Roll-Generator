import { GoogleGenAI } from "@google/genai";
import type { GeneratedImage, GeneratedVideo, AspectRatio, VideoModel, VideoResolution } from '../types';

async function pollVideoOperation(operation: any, ai: GoogleGenAI): Promise<any> {
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Polling every 5 seconds
        // @ts-ignore
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    return operation;
}

export const enhancePrompt = async (prompt: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const systemInstruction = `You are an expert prompt engineer for AI image and video generation.
Your task is to take a user's simple prompt and transform it into three distinct, highly detailed, and cinematic variations.
Each variation must be on its own line. Do not use any prefixes, labels, or markdown formatting like "-", "*", or "1.".
Focus on adding rich visual details, specific lighting conditions, camera angles, lens types, and artistic styles.
IMPORTANT: The response MUST be in the same language as the original user prompt.

Example user prompt: "a cat on a skateboard"

Example output:
A fluffy ginger cat wearing tiny sunglasses effortlessly cruises down a sun-drenched boardwalk, wide-angle lens, golden hour lighting, cinematic film grain.
Extreme close-up shot of a determined Siamese cat's paw gripping a colorful skateboard, shallow depth of field, set against a gritty urban alleyway at dusk.
High-speed action shot of a black cat performing a trick on a skateboard mid-air, motion blur, vibrant graffiti background, fisheye perspective, energetic and dynamic.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
            temperature: 0.9,
        }
    });

    const text = response.text;
    if (!text) {
        return [];
    }
    
    return text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
};

export const generateImages = async (prompt: string, numberOfImages: number, aspectRatio: AspectRatio): Promise<GeneratedImage[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });

    return response.generatedImages.map((img, index) => {
        const base64 = img.image.imageBytes;
        return {
            id: `img-${Date.now()}-${index}`,
            src: `data:image/jpeg;base64,${base64}`,
            base64,
            mimeType: 'image/jpeg',
        };
    });
};

interface GenerateVideoOptions {
    prompt: string;
    aspectRatio: AspectRatio;
    model: VideoModel;
    resolution: VideoResolution;
    image: GeneratedImage;
}

export const generateVideo = async (options: GenerateVideoOptions): Promise<GeneratedVideo> => {
    const { prompt, aspectRatio, model, resolution, image } = options;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const config: any = {
        numberOfVideos: 1,
        resolution,
        aspectRatio,
    };
    
    const operation = await ai.models.generateVideos({
        model,
        prompt: prompt || 'Animate this image.', // Use animation prompt, fallback if empty
        image: {
            imageBytes: image.base64,
            mimeType: image.mimeType,
        },
        config,
    });

    const completedOperation = await pollVideoOperation(operation, ai);
    
    // @ts-ignore
    const downloadLink = completedOperation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        // @ts-ignore
        const error = completedOperation.error?.message || "Video generation failed or returned no link.";
        throw new Error(error);
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return { url: videoUrl };
};
