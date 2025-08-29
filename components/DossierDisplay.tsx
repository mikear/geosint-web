
import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { DocumentTextIcon, ArrowTopRightOnSquareIcon, ShieldCheckIcon, SunIcon, BuildingOfficeIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon, ClipboardDocumentIcon, CheckIcon } from './Icons';

type Translator = (key: string) => string;

interface DossierDisplayProps {
    analysisData: AnalysisResult;
    exifData: any;
    geocodedLocation: string | null;
    aiGeocodedCoords: { lat: string; lon: string } | null;
    locationDiscrepancy: boolean;
    t: Translator;
}

const DossierSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-t border-cyan-500/30 pt-4 mt-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">{title}</h3>
        <div className="mt-2 text-slate-300">{children}</div>
    </div>
);

const DossierDisplay: React.FC<DossierDisplayProps> = ({ analysisData, exifData, geocodedLocation, aiGeocodedCoords, locationDiscrepancy, t }) => {
    const { locationName, description, confidenceScore, forensicAnalysis, environmentAnalysis, groundingSources } = analysisData;
    const [isCopied, setIsCopied] = useState(false);
    
    const finalLocation = geocodedLocation || locationName;
    const finalLocationSource = geocodedLocation ? t('locationFromExif') : '';

    const mapCoords = exifData?.latitude ? { lat: exifData.latitude, lon: exifData.longitude } : aiGeocodedCoords;
    const shouldShowMap = !!(exifData?.latitude && exifData?.longitude) || !!(aiGeocodedCoords && confidenceScore > 20);

    const mapSourceText = exifData?.latitude ? t('mapInfoExif') : t('mapInfoAI');
    const mapBorderColor = exifData?.latitude ? 'border-purple-500/50' : 'border-cyan-500/50';

    const exifItems = exifData ? [
        { label: 'Dispositivo', value: `${exifData.Make || ''} ${exifData.Model || ''}`.trim() },
        { label: 'Fecha de captura', value: exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toLocaleString() : null },
        { label: 'Exposición', value: exifData.ExposureTime ? `1/${Math.round(1 / exifData.ExposureTime)} s` : null },
        { label: 'Apertura', value: exifData.FNumber ? `ƒ/${exifData.FNumber}` : null },
        { label: 'ISO', value: exifData.ISOSpeedRatings },
        { label: 'Distancia Focal', value: exifData.FocalLength ? `${exifData.FocalLength}mm` : null },
    ].filter(item => item.value) : [];
    
    const handleCopyToClipboard = () => {
        if (!finalLocation) return;
        navigator.clipboard.writeText(finalLocation).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="w-full mt-8 animate-fade-in font-mono">
            <div className="bg-slate-900/70 rounded-lg shadow-2xl p-6 border border-cyan-500/50 backdrop-blur-sm">
                <header className="flex items-center space-x-3 pb-4 border-b border-cyan-500/30">
                    <DocumentTextIcon className="h-8 w-8 text-cyan-400"/>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 font-header">
                        {t('dossierTitle')}
                    </h2>
                </header>
                
                <div className="mt-4">
                    <h3 className="text-lg text-slate-400">{t('finalLocationLabel')} <span className="text-sm">{finalLocationSource}</span></h3>
                    <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-white">{finalLocation}</p>
                        <button
                            onClick={handleCopyToClipboard}
                            className="p-1.5 text-slate-400 rounded-md hover:bg-slate-700 hover:text-cyan-300 transition-colors duration-200 group relative"
                            title={isCopied ? t('copied') : t('copyToClipboard')}
                        >
                            {isCopied ? (
                                <CheckIcon className="h-5 w-5 text-green-400" />
                            ) : (
                                <ClipboardDocumentIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {geocodedLocation && (
                     <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">{t('aiHypothesisLabel')}</h3>
                        <p className="mt-1 text-base text-white">{locationName}</p>
                    </div>
                )}
                
                {locationDiscrepancy && (
                    <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-amber-300">{t('locationDiscrepancyTitle')}</h4>
                            <p className="text-sm text-amber-300/80">{t('locationDiscrepancyDesc')}</p>
                        </div>
                    </div>
                )}

                <DossierSection title={t('confidenceLevel')}>
                    <div className="flex items-center space-x-4">
                        <div className="w-full bg-slate-700 rounded-full h-4">
                            <div 
                                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-4 rounded-full" 
                                style={{ width: `${confidenceScore}%` }}
                            ></div>
                        </div>
                        <span className="font-bold text-lg text-cyan-300">{confidenceScore}%</span>
                    </div>
                </DossierSection>

                <DossierSection title={t('analysisSynthesis')}>
                    <p className="text-base font-sans leading-relaxed">{description}</p>
                </DossierSection>

                {groundingSources && groundingSources.length > 0 && (
                    <DossierSection title={t('verificationSources')}>
                        <p className="text-xs text-slate-400 mb-3 font-sans">{t('verificationSourceDesc')}</p>
                        <ul className="space-y-2">
                            {groundingSources.map((source, index) => (
                                <li key={index}>
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                                    >
                                        <span className="truncate">{source.title}</span>
                                        <ArrowTopRightOnSquareIcon className="ml-1.5 h-3 w-3 flex-shrink-0" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </DossierSection>
                )}
                
                {shouldShowMap && mapCoords && (() => {
                    const lat = parseFloat(String(mapCoords.lat));
                    const lon = parseFloat(String(mapCoords.lon));

                    if (isNaN(lat) || isNaN(lon)) {
                        return null; // No renderizar el mapa si las coordenadas son inválidas
                    }
                    
                    // Crear un cuadro delimitador para un nivel de zoom razonable. Un delta más pequeño = más zoom.
                    const delta = 0.008;
                    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
                    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
                    
                    return (
                        <DossierSection title={t('mapTitle')}>
                            <div className={`aspect-video w-full mt-2 rounded-lg overflow-hidden border-2 ${mapBorderColor}`}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src={mapUrl}
                                    style={{ border: 'none' }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{mapSourceText}</p>
                        </DossierSection>
                    );
                })()}

                <DossierSection title={t('preliminaryForensic')}>
                     <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-0.5">
                            {forensicAnalysis.isAltered ? (
                                <ExclamationTriangleIcon className="h-7 w-7 text-amber-400" />
                            ) : (
                                <ShieldCheckIcon className="h-7 w-7 text-green-400" />
                            )}
                        </div>
                        <div className="w-full">
                            <p className={`font-bold text-white ${forensicAnalysis.isAltered ? 'text-amber-300' : 'text-green-300'}`}>
                                {forensicAnalysis.isAltered ? t('imageAltered') : t('imageAuthentic')}
                            </p>
                            {forensicAnalysis.isAltered && (
                                <div className="mt-2">
                                    <label className="text-xs text-slate-400">{t('alterationConfidence')}</label>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                                            <div 
                                                className="bg-gradient-to-r from-yellow-500 to-red-500 h-2.5 rounded-full" 
                                                style={{ width: `${forensicAnalysis.alterationConfidence}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold text-amber-300">{forensicAnalysis.alterationConfidence}%</span>
                                    </div>
                                </div>
                            )}
                             <p className="text-sm font-sans leading-relaxed text-slate-400 mt-2">{forensicAnalysis.summary}</p>
                        </div>
                    </div>
                </DossierSection>

                <DossierSection title={t('environmentAnalysis')}>
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-0.5">
                           {environmentAnalysis.type === 'interior' && <BuildingOfficeIcon className="h-7 w-7 text-amber-400" />}
                           {environmentAnalysis.type === 'exterior' && <SunIcon className="h-7 w-7 text-yellow-400" />}
                           {environmentAnalysis.type === 'desconocido' && <QuestionMarkCircleIcon className="h-7 w-7 text-slate-400" />}
                        </div>
                        <div>
                            <p className="font-bold text-white capitalize">{environmentAnalysis.type}</p>
                            <p className="text-sm font-sans leading-relaxed mt-1 text-slate-400">{environmentAnalysis.details}</p>
                        </div>
                    </div>
                </DossierSection>

                <DossierSection title={t('fileMetadata')}>
                    {exifItems.length > 0 ? (
                        <dl className="space-y-2 text-sm">
                            {exifItems.map(item => (
                                <div key={item.label} className="grid grid-cols-2 gap-2">
                                    <dt className="font-medium text-slate-400 truncate">{item.label}</dt>
                                    <dd className="text-right text-slate-200 truncate">{String(item.value)}</dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className="text-slate-400 text-sm italic">{t('noExifData')}</p>
                    )}
                </DossierSection>

                <DossierSection title={t('manualVerification')}>
                    <div className='flex flex-col items-start'>
                        <a 
                            href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(window.location.href)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 font-sans"
                        >
                            <ArrowTopRightOnSquareIcon className="mr-2 h-4 w-4" />
                            {t('googleLensButton')}
                        </a>
                        <p className="text-xs text-slate-400 mt-2">{t('googleLensDesc')}</p>
                    </div>
                </DossierSection>
            </div>
            <style>{`
                .font-header { font-family: 'Orbitron', sans-serif; }
                .font-mono { font-family: 'Roboto Mono', monospace; }
                .font-sans { font-family: 'Inter', sans-serif; }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default DossierDisplay;
