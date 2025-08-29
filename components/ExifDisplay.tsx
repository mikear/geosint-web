import React from 'react';
import { InformationCircleIcon } from './Icons';

interface ExifDisplayProps {
    data: any;
}

const ExifDisplay: React.FC<ExifDisplayProps> = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="w-full animate-fade-in">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg shadow-lg p-6 border border-slate-600 h-full">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-300 flex items-center">
                        <InformationCircleIcon className="h-7 w-7 mr-3" />
                        Metadatos de la Imagen (EXIF)
                    </h2>
                    <p className="mt-4 text-slate-400">No se encontraron metadatos EXIF en esta imagen.</p>
                </div>
            </div>
        );
    }

    const { Make, Model, DateTimeOriginal, ExposureTime, FNumber, ISOSpeedRatings, FocalLength, latitude, longitude } = data;

    const exifItems = [
        { label: 'Dispositivo', value: `${Make || ''} ${Model || ''}`.trim() },
        { label: 'Fecha de captura', value: DateTimeOriginal ? new Date(DateTimeOriginal).toLocaleString() : null },
        { label: 'Exposición', value: ExposureTime ? `1/${Math.round(1 / ExposureTime)} s` : null },
        { label: 'Apertura', value: FNumber ? `ƒ/${FNumber}` : null },
        { label: 'ISO', value: ISOSpeedRatings },
        { label: 'Distancia Focal', value: FocalLength ? `${FocalLength}mm` : null },
    ].filter(item => item.value);

    return (
        <div className="w-full animate-fade-in">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg shadow-lg p-6 border border-slate-600 h-full">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-300 flex items-center">
                   <InformationCircleIcon className="h-7 w-7 mr-3" />
                   Metadatos de la Imagen (EXIF)
                </h2>
                <dl className="mt-4 space-y-2 text-slate-300">
                    {exifItems.map(item => (
                         <div key={item.label} className="flex justify-between text-sm">
                            <dt className="font-medium text-slate-400">{item.label}</dt>
                            <dd className="text-right">{item.value}</dd>
                        </div>
                    ))}
                </dl>
                {latitude && longitude && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                         <a 
                            href={`https://www.google.com/maps?q=${latitude},${longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 font-medium transition-colors text-sm"
                         >
                            Ver coordenadas en Google Maps &rarr;
                         </a>
                    </div>
                )}
            </div>
            <style>
                {`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
                `}
            </style>
        </div>
    );
};

export default ExifDisplay;
