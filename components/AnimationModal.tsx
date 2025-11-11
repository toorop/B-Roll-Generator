import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GeneratedImage, VideoModel, VideoResolution } from '../types';
import { VIDEO_MODELS, VIDEO_RESOLUTIONS, VEO_GENERATION_MESSAGES } from '../constants';
import { CloseIcon } from './icons/CloseIcon';
import { AnimateIcon } from './icons/AnimateIcon';

interface AnimationModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onGenerate: (
    image: GeneratedImage, 
    prompt: string, 
    model: VideoModel, 
    resolution: VideoResolution
  ) => void;
}

export const AnimationModal: React.FC<AnimationModalProps> = ({ image, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [videoModel, setVideoModel] = useLocalStorage<VideoModel>('videoModel', 'veo-3.1-fast-generate-preview');
  const [videoResolution, setVideoResolution] = useLocalStorage<VideoResolution>('videoResolution', '720p');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(image, prompt, videoModel, videoResolution);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-background-lighter rounded-lg overflow-hidden relative max-w-2xl w-full m-4 animate-modal-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-background flex justify-between items-center">
          <h2 className="text-lg font-bold">Animate Image</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors" aria-label="Close modal">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="p-6 space-y-4">
          <div className="flex gap-4">
            <img src={image.src} alt="Source for animation" className="w-32 h-32 object-cover rounded-md" />
            <div className="flex-grow">
               <label htmlFor="animation-prompt" className="block text-sm font-medium text-text-secondary mb-1">Animation Prompt (Optional)</label>
               <textarea
                    id="animation-prompt"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., The cat slowly wags its tail as a gentle breeze rustles the leaves."
                    className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition"
                />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="video-model" className="block text-sm font-medium text-text-secondary mb-1">Video Model</label>
              <select 
                  id="video-model" 
                  value={videoModel}
                  onChange={(e) => setVideoModel(e.target.value as VideoModel)}
                  className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none"
              >
                  {VIDEO_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="video-resolution" className="block text-sm font-medium text-text-secondary mb-1">Video Resolution</label>
              <select 
                  id="video-resolution" 
                  value={videoResolution}
                  onChange={(e) => setVideoResolution(e.target.value as VideoResolution)}
                  className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none"
              >
                  {VIDEO_RESOLUTIONS.map(res => <option key={res} value={res}>{res}</option>)}
              </select>
            </div>
          </div>

        </main>

        <footer className="p-4 bg-background flex justify-end items-center gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-md transition-colors"
          >
            <AnimateIcon />
            Generate Video
          </button>
        </footer>
      </form>
    </div>
  );
};
