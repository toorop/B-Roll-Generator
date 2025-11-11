import type { AspectRatio as ImagenAspectRatio, VideoModel as VeoModel, VideoResolution as VeoResolution } from '@google/genai';

// Re-exporting with local names for consistency, though they are strings.
export type AspectRatio = ImagenAspectRatio;
export type VideoModel = VeoModel;
export type VideoResolution = VeoResolution;

export interface GeneratedImage {
  id: string; // Unique identifier
  src: string;
  base64: string;
  mimeType: string;
}

// FIX: Define and export the GeneratedVideo interface, which is used by the geminiService.
export interface GeneratedVideo {
  url: string;
}

export interface VideoGalleryItem {
  id: string; // Unique identifier for the video job
  status: 'generating' | 'completed' | 'failed';
  url?: string; // URL of the completed video
  sourceImage: GeneratedImage;
  error?: string;
}

// A gallery can contain either generated images or video items
export type GalleryItem = GeneratedImage | VideoGalleryItem;