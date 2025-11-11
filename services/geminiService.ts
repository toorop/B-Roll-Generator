import { GoogleGenAI } from "@google/genai";
import type { GeneratedImage, GeneratedVideo, AspectRatio, VideoModel, VideoResolution } from '../types';

async function pollVideoOperation(operation: any, ai: GoogleGenAI): Promise<any> {
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        // @ts-ignore
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    return operation;
}

export const generateImages = async (apiKey: string, prompt: string, numberOfImages: number, aspectRatio: AspectRatio): Promise<GeneratedImage[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });

    return response.generatedImages.map(img => {
        const base64 = img.image.imageBytes;
        return {
            src: `data:image/jpeg;base64,${base64}`,
            base64,
            mimeType: 'image/jpeg',
        };
    });
};

export const generateVideo = async (
    apiKey: string,
    prompt: string, 
    aspectRatio: AspectRatio, 
    model: VideoModel, 
    resolution: VideoResolution, 
    duration: number,
    noSound: boolean,
    image?: GeneratedImage
): Promise<GeneratedVideo> => {
    const ai = new GoogleGenAI({ apiKey });

    const config: any = {
        numberOfVideos: 1,
        resolution,
        aspectRatio,
        durationSeconds: duration,
        generateAudio: !noSound,
    };
    
    let operation;
    if (image) {
        operation = await ai.models.generateVideos({
            model,
            prompt,
            image: {
                imageBytes: image.base64,
                mimeType: image.mimeType,
            },
            config,
        });
    } else {
        operation = await ai.models.generateVideos({
            model,
            prompt,
            config,
        });
    }

    const completedOperation = await pollVideoOperation(operation, ai);
    
    // @ts-ignore
    const downloadLink = completedOperation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    
    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return { url: videoUrl };
};