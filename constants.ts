import type { AspectRatio, VideoModel, VideoResolution } from './types';

export const VEO_GENERATION_MESSAGES: string[] = [
  "Contacting the video generation model...",
  "Your request is in the queue. This can take a few minutes.",
  "The AI is dreaming up your video...",
  "Rendering frames and compiling your clip...",
  "Almost there, adding the finishing touches...",
  "Still working on it, high-quality video takes time!"
];

export const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4'];

export const VIDEO_MODELS: VideoModel[] = ['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'];
export const VIDEO_RESOLUTIONS: VideoResolution[] = ['720p', '1080p'];
