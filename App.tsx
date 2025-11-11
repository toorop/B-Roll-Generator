import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeneratedImage, GeneratedVideo, GenerationHistoryItem, Tab, AspectRatio, VideoModel, VideoResolution } from './types';
import { generateImages as genImages, generateVideo as genVideo } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fileToBase64 } from './utils/fileUtils';
import { VEO_GENERATION_MESSAGES, ASPECT_RATIOS, VIDEO_MODELS, VIDEO_RESOLUTIONS } from './constants';
import { Spinner } from './components/Spinner';

// --- Helper Components defined outside to prevent re-renders ---

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  githubUrl: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, githubUrl }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSave = () => {
    if (inputKey.trim()) {
      onSave(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-light p-8 rounded-2xl shadow-2xl border border-background-lighter max-w-2xl w-full text-text-primary">
        <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Welcome to B-Roll Generator!</h2>
            <p className="text-text-secondary mb-6">To get started, you'll need a Google AI API Key.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left side: Instructions */}
            <div>
                <h3 className="font-semibold text-lg mb-3">How to Get Your API Key</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
                    <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-light underline">Google AI Studio</a>.</li>
                    <li>Click <strong>"Get API Key"</strong>, then <strong>"Create API key"</strong>.</li>
                    <li>Copy the generated key.</li>
                    <li>Paste it in the field below and start creating!</li>
                </ol>

                <div className="mt-8 bg-background p-4 rounded-lg border border-background-lighter">
                     <h4 className="font-semibold text-md mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                        </svg>
                        Your Privacy is Important
                     </h4>
                     <p className="text-xs text-text-muted">
                        Your API key is stored exclusively in your browser's local storage. It is never sent to any server other than Google's.
                     </p>
                     <p className="text-xs text-text-muted mt-2">
                         For full transparency, review the <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-light">source code on GitHub</a>.
                     </p>
                </div>
            </div>

            {/* Right side: Input */}
            <div className="bg-background p-6 rounded-lg border border-background-lighter flex flex-col justify-center h-full">
                 <label htmlFor="api-key-input" className="block text-sm font-medium text-text-secondary mb-2">Your Google AI API Key</label>
                 <input
                    id="api-key-input"
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Paste your API key here"
                    className="w-full bg-background-lighter border border-background-lighter rounded-lg p-3 mb-4 text-center focus:ring-2 focus:ring-brand-primary outline-none transition"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!inputKey.trim()}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    Save and Start Generating
                  </button>
            </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Application Component ---

export default function App() {
  const GITHUB_URL = "https://github.com/toorop/B-Roll-Generator";
  const [apiKey, setApiKey] = useLocalStorage<string | null>('googleApiKey', null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  const [currentTab, setCurrentTab] = useState<Tab>('image-to-video');
  const [imagePrompt, setImagePrompt] = useState('');
  const [numImages, setNumImages] = useState<number>(2);
  const [imageAspectRatio, setImageAspectRatio] = useState<AspectRatio>('16:9');
  
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<AspectRatio>('16:9');
  const [videoModel, setVideoModel] = useState<VideoModel>('veo-3.1-fast-generate-preview');
  const [videoResolution, setVideoResolution] = useState<VideoResolution>('720p');
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [noSound, setNoSound] = useState<boolean>(false);
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  
  const [loadingState, setLoadingState] = useState<'idle' | 'generating-images' | 'generating-video'>('idle');
  const [videoMessage, setVideoMessage] = useState('');
  
  const [history, setHistory] = useLocalStorage<GenerationHistoryItem[]>('generationHistory', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('favoritePrompts', []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeApiKey = process.env.API_KEY || apiKey;

  useEffect(() => {
    // On mount, check if we have a key. If not, open the modal.
    if (!activeApiKey) {
      setIsApiKeyModalOpen(true);
    }
  }, [activeApiKey]);

  useEffect(() => {
    if (videoModel === 'veo-3.1-generate-preview') {
        setVideoResolution('720p');
    }
  }, [videoModel]);

  useEffect(() => {
    let intervalId: number;
    if (loadingState === 'generating-video') {
      let messageIndex = 0;
      setVideoMessage(VEO_GENERATION_MESSAGES[messageIndex]);
      intervalId = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % VEO_GENERATION_MESSAGES.length;
        setVideoMessage(VEO_GENERATION_MESSAGES[messageIndex]);
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [loadingState]);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    setIsApiKeyModalOpen(false);
  };

  const ensureApiKey = (): string | null => {
      if (!activeApiKey) {
          setIsApiKeyModalOpen(true);
          return null;
      }
      return activeApiKey;
  }

  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    if (error?.message?.includes("API key not valid")) {
      alert("Your API key is not valid. Please enter a new one.");
      setApiKey(null);
      setIsApiKeyModalOpen(true);
    } else {
      alert(`An error occurred: ${error.message}`);
    }
    setLoadingState('idle');
  };

  const handleGenerateImages = async () => {
    const currentApiKey = ensureApiKey();
    if (!imagePrompt.trim() || loadingState !== 'idle' || !currentApiKey) return;
    
    setLoadingState('generating-images');
    setGeneratedImages([]);
    setSelectedImage(null);
    setGeneratedVideo(null);
    try {
      const images = await genImages(currentApiKey, imagePrompt, numImages, imageAspectRatio);
      setGeneratedImages(images);
      const historyItem: GenerationHistoryItem = { id: Date.now(), type: 'image', prompt: imagePrompt, results: images };
      setHistory([historyItem, ...history]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingState('idle');
    }
  };

  const handleGenerateVideo = async (prompt: string, image?: GeneratedImage) => {
    const currentApiKey = ensureApiKey();
    if ((!prompt.trim() && !image) || loadingState !== 'idle' || !currentApiKey) return;

    setLoadingState('generating-video');
    setGeneratedVideo(null);
    try {
      const video = await genVideo(currentApiKey, prompt, videoAspectRatio, videoModel, videoResolution, videoDuration, noSound, image);
      setGeneratedVideo(video);
      const historyItem: GenerationHistoryItem = { id: Date.now(), type: 'video', prompt, image, result: video };
      setHistory([historyItem, ...history]);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingState('idle');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setSelectedImage({
        src: `data:${file.type};base64,${base64}`,
        base64,
        mimeType: file.type,
      });
      setCurrentTab('image-to-video');
      setGeneratedImages([]);
    }
  };

  const renderContent = () => {
    const isLoadingImages = loadingState === 'generating-images';
    const isLoadingVideo = loadingState === 'generating-video';
    
    return (
      <div className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">B-Roll Generator</h1>
            <p className="mt-2 text-text-secondary">Your AI-powered creative partner for stunning visuals.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center bg-background-light p-1 rounded-lg max-w-md mx-auto">
            { (['image-to-video', 'text-to-video'] as Tab[]).map(tab => (
                 <button key={tab} onClick={() => { setCurrentTab(tab); setSelectedImage(null); }}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${currentTab === tab ? 'bg-brand-primary text-white shadow' : 'text-text-muted hover:bg-background-lighter'}`}>
                    {tab === 'image-to-video' ? 'Image to Video' : 'Text to Video'}
                 </button>
            ))}
        </div>
        
        {/* Main Content Area */}
        <div className="bg-background-light p-6 rounded-2xl shadow-lg border border-background-lighter">
            {currentTab === 'image-to-video' && (
              <>
                 {/* Image Generation Prompt */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2">
                        <label htmlFor="image-prompt" className="block text-sm font-medium text-text-secondary mb-1">Describe a scene</label>
                        <textarea id="image-prompt" rows={2} value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                           placeholder="e.g., A cinematic shot of a neon-lit ramen shop on a rainy Tokyo night"
                           className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="num-images" className="block text-sm font-medium text-text-secondary mb-1">Images</label>
                           <select id="num-images" value={numImages} onChange={e => setNumImages(Number(e.target.value))}
                              className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition">
                              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                           </select>
                        </div>
                        <div>
                           <label htmlFor="image-aspect-ratio" className="block text-sm font-medium text-text-secondary mb-1">Aspect Ratio</label>
                           <select id="image-aspect-ratio" value={imageAspectRatio} onChange={e => setImageAspectRatio(e.target.value as AspectRatio)}
                              className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition">
                              {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <button onClick={handleGenerateImages} disabled={isLoadingImages || !imagePrompt.trim()}
                       className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2">
                       {isLoadingImages && <Spinner />}
                       {isLoadingImages ? 'Generating...' : 'Generate Images'}
                    </button>
                    <span className="text-text-muted">or</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-background-lighter hover:bg-gray-600 text-text-primary font-bold rounded-lg transition-colors">
                       Upload Image
                    </button>
                </div>

                {/* Image Gallery */}
                {(isLoadingImages || generatedImages.length > 0) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-center">Generated Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {isLoadingImages ? (
                            Array.from({ length: numImages }).map((_, i) => (
                                <div key={i} className="aspect-video bg-background-lighter rounded-lg flex items-center justify-center animate-pulse"><Spinner /></div>
                            ))
                        ) : (
                            generatedImages.map((img, index) => (
                                <div key={index} className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${selectedImage?.src === img.src ? 'ring-4 ring-brand-primary scale-105' : 'hover:scale-105'}`}
                                     onClick={() => setSelectedImage(img)}>
                                    <img src={img.src} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <span className="text-white font-bold">Select</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                  </div>
                )}
              </>
            )}

            {currentTab === 'text-to-video' && (
                <div>
                     <div className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="video-prompt" className="block text-sm font-medium text-text-secondary mb-1">Describe a video</label>
                            <textarea id="video-prompt" rows={2} value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                               placeholder="e.g., An astronaut riding a horse on Mars, cinematic 4K"
                               className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div>
                               <label htmlFor="video-aspect-ratio" className="block text-sm font-medium text-text-secondary mb-1">Aspect Ratio</label>
                               <select id="video-aspect-ratio" value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as AspectRatio)}
                                  className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition">
                                  {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                               </select>
                           </div>
                           <div>
                               <label htmlFor="video-model" className="block text-sm font-medium text-text-secondary mb-1">Model</label>
                               <select id="video-model" value={videoModel} onChange={e => setVideoModel(e.target.value as VideoModel)}
                                  className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition">
                                  {VIDEO_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                               </select>
                           </div>
                           <div>
                               <label htmlFor="video-resolution" className="block text-sm font-medium text-text-secondary mb-1">Resolution</label>
                               <select id="video-resolution" value={videoResolution} onChange={e => setVideoResolution(e.target.value as VideoResolution)}
                                  disabled={videoModel === 'veo-3.1-generate-preview'}
                                  className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition disabled:bg-background-lighter disabled:cursor-not-allowed">
                                  {VIDEO_RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                               </select>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div>
                                <label htmlFor="video-duration" className="block text-sm font-medium text-text-secondary mb-1">Duration (s)</label>
                                <input type="number" id="video-duration" value={videoDuration} onChange={e => setVideoDuration(Math.max(1, Number(e.target.value)))} min="1"
                                    className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition" />
                            </div>
                            <div className="flex items-center justify-start md:pt-7">
                                <input type="checkbox" id="no-sound" checked={noSound} onChange={e => setNoSound(e.target.checked)}
                                    className="h-4 w-4 rounded border-background-lighter bg-background text-brand-primary focus:ring-brand-primary" />
                                <label htmlFor="no-sound" className="ml-2 text-sm font-medium text-text-secondary">
                                    Generate without sound
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                         <button onClick={() => handleGenerateVideo(videoPrompt)} disabled={isLoadingVideo || !videoPrompt.trim()}
                           className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2">
                           {isLoadingVideo && <Spinner />}
                           {isLoadingVideo ? 'Generating...' : 'Generate Video'}
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        {/* Animate and Video Player Section */}
        {(selectedImage || (currentTab === 'text-to-video' && (isLoadingVideo || generatedVideo))) && (
          <div className="bg-background-light p-6 rounded-2xl shadow-lg border border-background-lighter">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {selectedImage && (
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Image to Animate</h3>
                        <img src={selectedImage.src} alt="Selected for animation" className="rounded-lg max-h-64 mx-auto"/>
                    </div>
                  )}

                  <div className={`${!selectedImage && currentTab==='text-to-video' ? 'col-span-2': ''}`}>
                      <h3 className="text-lg font-semibold mb-2">{selectedImage ? 'Animate Image' : 'Video Generation'}</h3>
                      {selectedImage &&
                      <>
                        <label htmlFor="animation-prompt" className="block text-sm font-medium text-text-secondary mb-1">Describe a movement (optional)</label>
                        <textarea id="animation-prompt" rows={2} value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                           placeholder="e.g., slow zoom in, the character blinks"
                           className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                               <label htmlFor="video-model-anim" className="block text-sm font-medium text-text-secondary mb-1">Model</label>
                               <select id="video-model-anim" value={videoModel} onChange={e => setVideoModel(e.target.value as VideoModel)}
                                  className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition">
                                  {VIDEO_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                               </select>
                            </div>
                            <div>
                               <label htmlFor="video-resolution-anim" className="block text-sm font-medium text-text-secondary mb-1">Resolution</label>
                               <select id="video-resolution-anim" value={videoResolution} onChange={e => setVideoResolution(e.target.value as VideoResolution)}
                                  disabled={videoModel === 'veo-3.1-generate-preview'}
                                  className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition disabled:bg-background-lighter disabled:cursor-not-allowed">
                                  {VIDEO_RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                               </select>
                            </div>
                            <div>
                                <label htmlFor="video-duration-anim" className="block text-sm font-medium text-text-secondary mb-1">Duration (s)</label>
                                <input type="number" id="video-duration-anim" value={videoDuration} onChange={e => setVideoDuration(Math.max(1, Number(e.target.value)))} min="1"
                                    className="w-full bg-background border border-background-lighter rounded-lg p-2 focus:ring-2 focus:ring-brand-primary outline-none transition" />
                            </div>
                            <div className="flex items-center justify-start sm:pt-7">
                                <input type="checkbox" id="no-sound-anim" checked={noSound} onChange={e => setNoSound(e.target.checked)}
                                    className="h-4 w-4 rounded border-background-lighter bg-background text-brand-primary focus:ring-brand-primary" />
                                <label htmlFor="no-sound-anim" className="ml-2 text-sm font-medium text-text-secondary">
                                    Generate without sound
                                </label>
                            </div>
                        </div>
                      </>
                      }

                      {isLoadingVideo && (
                         <div className="bg-background p-4 rounded-lg text-center">
                           <Spinner />
                           <p className="font-semibold mt-2">Generating your video...</p>
                           <p className="text-text-secondary text-sm mt-1">{videoMessage}</p>
                         </div>
                      )}

                      {!isLoadingVideo && selectedImage && (
                         <div className="flex justify-center">
                            <button onClick={() => handleGenerateVideo(videoPrompt, selectedImage)}
                               className="px-6 py-2 bg-gradient-to-r from-brand-secondary to-purple-600 hover:opacity-90 text-white font-bold rounded-lg transition-opacity flex items-center gap-2">
                                Animate
                            </button>
                         </div>
                      )}
                      
                      {generatedVideo && !isLoadingVideo && (
                        <div className="mt-4">
                           <video src={generatedVideo.url} controls autoPlay loop className="w-full rounded-lg bg-black"></video>
                           <a href={generatedVideo.url} download={`b-roll-${Date.now()}.mp4`}
                              className="mt-4 block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">
                              Download Video
                           </a>
                        </div>
                      )}
                  </div>
              </div>
          </div>
        )}

      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isApiKeyModalOpen && <ApiKeyModal onSave={handleSaveApiKey} githubUrl={GITHUB_URL} />}
      {activeApiKey ? renderContent() : (
         <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <Spinner className="w-10 h-10 mx-auto mb-4" />
              <p className="text-text-secondary">Awaiting API key configuration...</p>
            </div>
         </div>
      )}
    </div>
  );
}