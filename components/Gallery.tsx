import React from 'react';
import type { GalleryItem, GeneratedImage } from '../types';
import { Spinner } from './Spinner';
import { AnimateIcon } from './icons/AnimateIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface GalleryProps {
    items: GalleryItem[];
    isLoading: boolean;
    onAnimate: (image: GeneratedImage) => void;
}

// A simple utility to download a file from a src URL
const downloadFile = (src: string, filename: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const GalleryItemMemo = React.memo(({ item, onAnimate }: { item: GalleryItem, onAnimate: (image: GeneratedImage) => void }) => {
    // Type guard to check if the item is an image
    if ('src' in item) {
        const image = item;
        return (
            <div className="group relative aspect-video bg-background-lighter rounded-lg overflow-hidden animate-fade-in">
                <img src={image.src} alt="Generated result" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-4">
                    <button
                        onClick={() => onAnimate(image)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/80 hover:bg-brand-primary text-white font-semibold rounded-md transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                    >
                        <AnimateIcon /> Animate
                    </button>
                    <button
                        onClick={() => downloadFile(image.src, `${image.id}.jpeg`)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 hover:bg-gray-600 text-white font-semibold rounded-md transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                        style={{ transitionDelay: '50ms' }}
                    >
                       <DownloadIcon /> Download
                    </button>
                </div>
            </div>
        );
    }
    
    // Item is a VideoGalleryItem
    const video = item;
    return (
        <div className="aspect-video bg-background-lighter rounded-lg overflow-hidden flex items-center justify-center relative group animate-fade-in">
            {video.status === 'generating' && (
                <div className="flex flex-col items-center text-center p-4">
                    <Spinner className="w-8 h-8 mb-2" />
                    <p className="text-sm font-semibold text-text-primary">Generating Video...</p>
                    <p className="text-xs text-text-muted">This may take a moment.</p>
                </div>
            )}
            {video.status === 'completed' && video.url && (
                 <>
                    <video src={video.url} controls autoPlay loop muted className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                         <button
                            onClick={() => downloadFile(video.url!, `${video.id}.mp4`)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 hover:bg-gray-600 text-white font-semibold rounded-md transition-all opacity-0 group-hover:opacity-100"
                        >
                            <DownloadIcon /> Download Video
                        </button>
                    </div>
                </>
            )}
            {video.status === 'failed' && (
                <div className="flex flex-col items-center text-center p-4">
                    <p className="text-sm font-semibold text-red-500">Generation Failed</p>
                    <p className="text-xs text-text-muted mt-1">{video.error || "An unknown error occurred."}</p>
                </div>
            )}
            {/* Show source image in the background for context */}
            <img src={video.sourceImage.src} alt="Source for video" className="absolute inset-0 w-full h-full object-cover -z-10 opacity-10" />
        </div>
    );
});


export const Gallery: React.FC<GalleryProps> = ({ items, isLoading, onAnimate }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner className="w-10 h-10" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-text-muted">Your generated images and videos will appear here.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => <GalleryItemMemo key={item.id} item={item} onAnimate={onAnimate} />)}
        </div>
    );
};
