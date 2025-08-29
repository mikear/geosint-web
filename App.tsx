
import React, { useState, useCallback } from 'react';
import exifr from 'exifr';
import { runFullAnalysis, AnalysisPhase } from './services/backendService';
import { reverseGeocode, geocodeLocationName } from './services/geolocationService';
import { AnalysisResult } from './types';
import { CameraIcon, MagnifyingGlassIcon, XCircleIcon, GitHubIcon, LinkedInIcon, QuestionMarkCircleIcon } from './components/Icons';
import ImagePreview from './components/ImagePreview';
import AnalysisInProgress from './components/AnalysisInProgress';
import DossierDisplay from './components/DossierDisplay';
import TermsOfUseModal from './components/TermsOfUseModal';
import LanguageSelector from './components/LanguageSelector';
import InfoModal from './components/InfoModal';
// FIX: Import TranslationKey type for type safety
import { Language, getBrowserLanguage, getTranslator, type TranslationKey } from './i18n';

type AppState = 'initial' | 'analyzing' | 'success' | 'error';

const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [exifData, setExifData] = useState<any | null>(null);
    const [geocodedLocation, setGeocodedLocation] = useState<string | null>(null);
    const [aiGeocodedCoords, setAiGeocodedCoords] = useState<{ lat: string; lon: string } | null>(null);
    const [locationDiscrepancy, setLocationDiscrepancy] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [appState, setAppState] = useState<AppState>('initial');
    const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('initialization');
    const [showTermsModal, setShowTermsModal] = useState<boolean>(!localStorage.getItem('termsAccepted'));
    const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
    const [language, setLanguage] = useState<Language>(getBrowserLanguage());
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const t = useCallback(getTranslator(language), [language]);

    const resetState = (clearInput = true) => {
        setImageFile(null);
        setImageUrl(null);
        setAnalysisResult(null);
        setExifData(null);
        setGeocodedLocation(null);
        setAiGeocodedCoords(null);
        setLocationDiscrepancy(false);
        setError(null);
        setAppState('initial');
        if (clearInput) {
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }

    const processFile = async (file: File) => {
        resetState(false);

        if (!file.type.startsWith('image/')) {
            setError(t('errorInvalidFile'));
            setAppState('error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError(t('errorFileSize'));
            setAppState('error');
            return;
        }

        setImageFile(file); // Store original file for EXIF

        const getImageUrlFromFile = (inputFile: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                // If it's a GIF, extract the first frame onto a canvas and return a JPEG data URL
                if (inputFile.type.toLowerCase() === 'image/gif') {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            const staticImageUrl = canvas.toDataURL('image/jpeg', 0.9);
                            resolve(staticImageUrl);
                        } else {
                            reject(new Error("Failed to get canvas context for GIF conversion."));
                        }
                        URL.revokeObjectURL(img.src);
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(img.src);
                        reject(new Error("Failed to load GIF for conversion."));
                    };
                    img.src = URL.createObjectURL(inputFile);
                } else {
                    // For other image types, use FileReader
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            resolve(reader.result as string);
                        } else {
                            reject(new Error("Failed to read image file."));
                        }
                    };
                    reader.onerror = () => {
                        reject(new Error("Error reading image file."));
                    };
                    reader.readAsDataURL(inputFile);
                }
            });
        };

        try {
            const url = await getImageUrlFromFile(file);
            setImageUrl(url);

            // Isolate EXIF parsing to prevent it from blocking the main flow.
            try {
                const data = await exifr.parse(file);
                setExifData(data);
                if (data?.latitude && data?.longitude) {
                    const address = await reverseGeocode(data.latitude, data.longitude, language);
                    setGeocodedLocation(address);
                } else {
                    setGeocodedLocation(null);
                }
            } catch (exifError) {
                console.warn("Could not parse EXIF data:", exifError);
                // Reset EXIF related state, but don't show a blocking error to the user.
                setExifData(null);
                setGeocodedLocation(null);
            }
        } catch (processingError) {
            // This will now only catch critical errors from getImageUrlFromFile
            console.error("Error processing file:", processingError);
            const message = processingError instanceof Error ? processingError.message : t('errorInvalidFile');
            setError(message);
            setAppState('error');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
        event.target.value = ''; // Clear input to allow re-uploading the same file
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!showTermsModal) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Necessary to allow drop
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (showTermsModal) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleAnalysisClick = useCallback(async () => {
        if (!imageFile || !imageUrl) return;

        setAppState('analyzing');
        setAnalysisPhase('initialization');
        setError(null);
        setAnalysisResult(null);
        setAiGeocodedCoords(null);
        setLocationDiscrepancy(false);

        try {
            const base64Data = imageUrl.split(',')[1];
            const mimeType = imageUrl.match(/data:(.*);base64/)?.[1];

            if (!mimeType) {
                throw new Error("Could not determine image MIME type from data URL.");
            }
            
            const { finalReport } = await runFullAnalysis(
                base64Data, 
                mimeType,
                (phase) => setAnalysisPhase(phase),
                language,
                exifData // Pass EXIF data to the backend
            );
            
            setAnalysisResult(finalReport);
            
            let coords = null;
            if (finalReport && finalReport.locationName && finalReport.locationName !== 'Unknown Location') {
                coords = await geocodeLocationName(finalReport.locationName, language);
                setAiGeocodedCoords(coords);
            }

            // Check for discrepancy
            if (geocodedLocation && coords && exifData?.latitude && exifData?.longitude) {
                 if (!finalReport.locationName.toLowerCase().includes(geocodedLocation.split(',')[0].toLowerCase())) {
                    const R = 6371; // Radius of the earth in km
                    const dLat = (parseFloat(coords.lat) - exifData.latitude) * (Math.PI/180);
                    const dLon = (parseFloat(coords.lon) - exifData.longitude) * (Math.PI/180);
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(exifData.latitude * (Math.PI/180)) * Math.cos(parseFloat(coords.lat) * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distance = R * c; // Distance in km
                    if (distance > 50) { // If locations are more than 50km apart
                         setLocationDiscrepancy(true);
                    }
                 }
            }

            setAppState('success');
        } catch (err) {
            console.error(err);
            // FIX: Use TranslationKey type for error message keys
            let errorMessageKey: TranslationKey = 'errorGeneric';
            if (err instanceof Error) {
                switch(err.message) {
                    case 'QUOTA_EXCEEDED':
                        errorMessageKey = 'errorApiQuota';
                        break;
                    case 'INVALID_API_KEY':
                        errorMessageKey = 'errorInvalidApiKey';
                        break;
                    case 'INVALID_RESPONSE_FORMAT':
                        errorMessageKey = 'errorInvalidResponse';
                        break;
                    case 'GENERIC_ERROR':
                    default:
                        errorMessageKey = 'errorGeneric';
                        break;
                }
            }
            setError(t(errorMessageKey));
            setAppState('error');
        }
    }, [imageFile, imageUrl, language, geocodedLocation, exifData, t]);
    
    const handleAcceptTerms = () => {
        localStorage.setItem('termsAccepted', 'true');
        setShowTermsModal(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            {showTermsModal && <TermsOfUseModal onAccept={handleAcceptTerms} t={t} />}
            {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} t={t} />}
            <div className="fixed inset-0 bg-grid-pattern opacity-10 -z-10"></div>
            
            <header className="w-full max-w-4xl mb-8 flex justify-between items-center">
                <div className="text-left">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-header">
                        GeOsint
                    </h1>
                    <p className="mt-2 text-lg text-slate-300 font-mono">
                        {t('tagline')}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowInfoModal(true)} className="p-2 bg-slate-800/50 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors" aria-label="Show info">
                        <QuestionMarkCircleIcon className="h-5 w-5 text-slate-400" />
                    </button>
                    <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                </div>
            </header>

            <main className="w-full max-w-4xl bg-slate-900/50 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md border border-slate-700/50">
                <div className="flex flex-col items-center">
                    {!imageUrl && appState !== 'analyzing' && (
                         <div 
                            className={`w-full border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-300 relative group ${isDragging ? 'border-cyan-400 bg-slate-800/50' : 'border-slate-600 hover:border-cyan-400'}`}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                             <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300"></div>
                             <label htmlFor="file-upload" className={`relative ${showTermsModal ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <CameraIcon className="mx-auto h-12 w-12 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                                <h3 className="mt-2 text-lg font-medium text-white font-header">{t('uploadTitle')}</h3>
                                <p className="mt-1 text-sm text-slate-400 font-mono">{t('uploadDragDrop')}</p>
                                <p className="mt-1 text-xs text-slate-500 font-mono">{t('uploadSubtitle')}</p>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" disabled={showTermsModal} />
                            </label>
                        </div>
                    )}
                    
                    {imageUrl && <ImagePreview imageUrl={imageUrl} onClear={() => resetState()} t={t} />}
                    
                    {appState === 'error' && error && (
                        <div className="mt-6 w-full bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center space-x-3 font-mono">
                            <XCircleIcon className="h-6 w-6"/>
                            <span>{t('errorPrefix')}: {error}</span>
                        </div>
                    )}

                    {imageUrl && appState !== 'analyzing' && appState !== 'success' && (
                        <div className="mt-6 w-full flex flex-col items-center">
                           <button
                                onClick={handleAnalysisClick}
                                className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 font-header"
                            >
                                <MagnifyingGlassIcon className="-ml-1 mr-3 h-5 w-5" />
                                {t('analyzeButton')}
                            </button>
                        </div>
                    )}
                    
                    {appState === 'analyzing' && imageUrl && <AnalysisInProgress imageUrl={imageUrl} phase={analysisPhase} t={t} />}
                    
                    {appState === 'success' && analysisResult && (
                        <DossierDisplay 
                            analysisData={analysisResult} 
                            exifData={exifData} 
                            geocodedLocation={geocodedLocation}
                            aiGeocodedCoords={aiGeocodedCoords}
                            locationDiscrepancy={locationDiscrepancy}
                            t={t}
                        />
                    )}
                </div>
            </main>

            <footer className="mt-auto pt-8 text-center text-slate-500 text-sm font-mono">
                <div className="flex items-center justify-center space-x-4">
                    <span>{t('footerCredits')}</span>
                    <a href="https://github.com/mikear" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors"><GitHubIcon className="h-5 w-5" /></a>
                    <a href="https://www.linkedin.com/in/rabalo" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors"><LinkedInIcon className="h-5 w-5" /></a>
                </div>
            </footer>
            <style>{`
                .font-header { font-family: 'Orbitron', sans-serif; }
                .font-sans { font-family: 'Inter', sans-serif; }
                .font-mono { font-family: 'Roboto Mono', monospace; }
                .bg-grid-pattern {
                    background-image: linear-gradient(rgba(20, 83, 136, 0.2) 1px, transparent 1px), linear-gradient(to right, rgba(20, 83, 136, 0.2) 1px, transparent 1px);
                    background-size: 30px 30px;
                }
            `}</style>
        </div>
    );
};

export default App;
