export type Tab = 'image-to-video' | 'text-to-video';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export type VideoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
export type VideoResolution = '720p' | '1080p';

export interface GeneratedImage {
  src: string;
  base64: string;
  mimeType: string;
}

export interface GeneratedVideo {
  url: string;
}

export interface ImageGenerationHistory {
  id: number;
  type: 'image';
  prompt: string;
  results: GeneratedImage[];
}

export interface VideoGenerationHistory {
  id: number;
  type: 'video';
  prompt: string;
  image?: GeneratedImage;
  result: GeneratedVideo;
}

export type GenerationHistoryItem = ImageGenerationHistory | VideoGenerationHistory;