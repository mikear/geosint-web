
import React from 'react';
import { XCircleIcon } from './Icons';

interface ImagePreviewProps {
    imageUrl: string;
    onClear: () => void;
    t: (key: string) => string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onClear, t }) => {
    return (
        <div className="mt-4 relative w-full max-w-lg mx-auto group">
            <img src={imageUrl} alt="Vista previa" className="rounded-lg shadow-lg w-full h-auto object-contain max-h-[50vh]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
            <button
                onClick={onClear}
                className="absolute -top-3 -right-3 bg-slate-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-500 transform hover:scale-110"
                aria-label={t('Eliminar imagen')}
            >
                <XCircleIcon className="h-8 w-8" />
            </button>
            <style>{`
                .bg-grid-pattern {
                    background-image: linear-gradient(to right, rgba(0, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 255, 0.2) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
            `}</style>
        </div>
    );
};

export default ImagePreview;
