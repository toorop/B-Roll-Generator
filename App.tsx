import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from './components/Spinner';
import { AnimationModal } from './components/AnimationModal';
import { PromptInput } from './components/PromptInput';
import { Gallery } from './components/Gallery';
import { enhancePrompt, generateImages, generateVideo } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ASPECT_RATIOS } from './constants';
import type { GeneratedImage, AspectRatio, VideoModel, VideoResolution, GalleryItem } from './types';

// Type definition for aistudio API
declare global {
  // FIX: Moved the AIStudio interface inside the `declare global` block to resolve module scope conflicts.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

function App() {
  // API Key State
  const [hasSelectedApiKey, setHasSelectedApiKey] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);

  // Prompt and Suggestions State
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Generation Settings State
  const [numberOfImages, setNumberOfImages] = useLocalStorage('numberOfImages', 1);
  const [aspectRatio, setAspectRatio] = useLocalStorage<AspectRatio>('aspectRatio', '16:9');
  
  // Generation Results State
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  // Modal State
  const [imageToAnimate, setImageToAnimate] = useState<GeneratedImage | null>(null);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // API Key Check
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio?.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasSelectedApiKey(hasKey);
        }
      } catch (e) {
        console.error("Error checking for API key:", e);
        setHasSelectedApiKey(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    try {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            setHasSelectedApiKey(true);
        }
    } catch (e) {
        console.error("Error opening select key dialog:", e);
        setError("Could not open the API key selection dialog.");
    }
  };

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const enhancedPrompts = await enhancePrompt(prompt);
      setSuggestions(enhancedPrompts);
    } catch (e: any) {
      setError(`Failed to enhance prompt: ${e.message}`);
      if (e.message?.includes("Requested entity was not found.")) {
        setHasSelectedApiKey(false);
      }
    } finally {
      setIsEnhancing(false);
    }
  }, [prompt]);

  const handleGenerateImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsGeneratingImages(true);
    setError(null);
    // Clear previous images from the gallery but keep videos
    setGalleryItems(prev => prev.filter(item => 'status' in item));

    try {
      const images = await generateImages(prompt, numberOfImages, aspectRatio);
      setGalleryItems(prev => [...images, ...prev]);
    } catch (e: any) {
      setError(`Failed to generate images: ${e.message}`);
      if (e.message?.includes("Requested entity was not found.")) {
          setHasSelectedApiKey(false);
      }
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const handleGenerateVideo = useCallback(async (
    sourceImage: GeneratedImage, 
    animationPrompt: string, 
    model: VideoModel, 
    resolution: VideoResolution
  ) => {
    setImageToAnimate(null); // Close modal
    setError(null);

    const videoId = `video-${Date.now()}`;
    const newVideoItem = {
      id: videoId,
      status: 'generating' as const,
      sourceImage,
    };

    setGalleryItems(prev => [newVideoItem, ...prev]);
    
    try {
      const video = await generateVideo({
        prompt: animationPrompt, 
        image: sourceImage,
        aspectRatio, 
        model, 
        resolution, 
      });

      setGalleryItems(prev => prev.map(item => 
        item.id === videoId ? { ...item, status: 'completed' as const, url: video.url } : item
      ));

    } catch (e: any) {
      console.error(e);
      setError(`Failed to generate video: ${e.message}`);
      setGalleryItems(prev => prev.map(item => 
        item.id === videoId ? { ...item, status: 'failed' as const, error: e.message } : item
      ));
      if (e.message?.includes("Requested entity was not found.")) {
          setHasSelectedApiKey(false);
      }
    }
  }, [aspectRatio]);


  if (isCheckingApiKey) {
    return (
        <div className="bg-background min-h-screen flex items-center justify-center">
            <Spinner className="w-12 h-12" />
        </div>
    );
  }

  if (!hasSelectedApiKey) {
    return (
        <div className="bg-background min-h-screen flex items-center justify-center text-center p-4">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Welcome!</h1>
                <p className="text-text-secondary mb-4">To use this B-Roll Generator, you need to select a Gemini API key.</p>
                <button 
                    onClick={handleSelectKey}
                    className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-md transition-colors"
                >
                    Select API Key
                </button>
                <p className="text-xs text-text-muted mt-4">
                    Video generation may incur costs. Please review the 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline ml-1">
                        billing documentation
                    </a> for details.
                </p>
                 {error && <p className="mt-4 text-red-500">{error}</p>}
            </div>
        </div>
    );
  }

  return (
    <div className="bg-background text-text-primary min-h-screen flex flex-col">
      <header className="py-4 px-8 border-b border-background-lighter flex-shrink-0">
        <h1 className="text-2xl font-bold">B-Roll Generator</h1>
        <p className="text-text-secondary">Create stunning visuals from simple text prompts.</p>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 overflow-hidden">
        {/* Left Column: Controls (1/3 width) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
            <form onSubmit={handleGenerateImages} className="space-y-6">
            <PromptInput
                id="main-prompt"
                label="Your Prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A cinematic shot of a robot cat driving a vintage car on Mars"
                onEnhanceClick={handleEnhancePrompt}
                isEnhancing={isEnhancing}
                suggestions={suggestions}
                onSuggestionClick={(suggestion) => {
                setPrompt(suggestion);
                setSuggestions([]);
                }}
                onDismissSuggestions={() => setSuggestions([])}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label htmlFor="aspect-ratio" className="block text-sm font-medium text-text-secondary mb-1">Aspect Ratio</label>
                <select 
                    id="aspect-ratio" 
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    {ASPECT_RATIOS.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                </select>
                </div>
                <div>
                    <label htmlFor="num-images" className="block text-sm font-medium text-text-secondary mb-1">Number of Images <span className="text-text-muted">({numberOfImages})</span></label>
                    <input
                        id="num-images"
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={numberOfImages}
                        onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
            
            {error && <p className="text-red-500 text-center">{error}</p>}
            
            <button
                type="submit"
                disabled={isGeneratingImages || !prompt.trim()}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-lg transition-colors disabled:bg-gray-500"
            >
                {isGeneratingImages ? <><Spinner /> Generating Images...</> : 'Generate Images'}
            </button>
            </form>
        </div>

        {/* Right Column: Gallery (2/3 width) */}
        <div className="bg-background-dark rounded-lg p-4 overflow-y-auto lg:col-span-2">
           <Gallery
             items={galleryItems}
             isLoading={isGeneratingImages && galleryItems.filter(i => 'src' in i).length === 0}
             onAnimate={(image) => setImageToAnimate(image)}
           />
        </div>
      </div>
      
      {imageToAnimate && (
        <AnimationModal 
            image={imageToAnimate}
            onClose={() => setImageToAnimate(null)}
            onGenerate={handleGenerateVideo}
        />
      )}
    </div>
  );
}

export default App;
