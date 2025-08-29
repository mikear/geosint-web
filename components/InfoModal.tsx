
import React, { useState } from 'react';
import { XCircleIcon } from './Icons';

type Translator = (key: string) => string;

interface InfoModalProps {
    onClose: () => void;
    t: Translator;
}

type Tab = 'about' | 'help' | 'tech';

const InfoModal: React.FC<InfoModalProps> = ({ onClose, t }) => {
    const [activeTab, setActiveTab] = useState<Tab>('about');

    const renderContent = () => {
        switch (activeTab) {
            case 'about':
                return (
                    <div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-2 font-header">{t('aboutTitle')}</h3>
                        <p className="text-slate-300 font-sans">{t('aboutDesc')}</p>
                    </div>
                );
            case 'help':
                return (
                    <div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-4 font-header">{t('helpTitle')}</h3>
                        <ul className="space-y-4">
                            <li>
                                <h4 className="font-bold text-slate-200">{t('helpStep1')}</h4>
                                <p className="text-sm text-slate-400 font-sans">{t('helpStep1Desc')}</p>
                            </li>
                            <li>
                                <h4 className="font-bold text-slate-200">{t('helpStep2')}</h4>
                                <p className="text-sm text-slate-400 font-sans">{t('helpStep2Desc')}</p>
                            </li>
                            <li>
                                <h4 className="font-bold text-slate-200">{t('helpStep3')}</h4>
                                <p className="text-sm text-slate-400 font-sans">{t('helpStep3Desc')}</p>
                            </li>
                        </ul>
                    </div>
                );
            case 'tech':
                return (
                    <div>
                        <h3 className="text-xl font-bold text-cyan-300 mb-4 font-header">{t('techTitle')}</h3>
                        <p className="text-slate-300 mb-4 font-sans">{t('techHowItWorks')}</p>
                        <ul className="space-y-3 list-disc list-inside text-sm text-slate-400 font-sans">
                            <li>{t('techStep1')}</li>
                            <li>{t('techStep2')}</li>
                            <li>{t('techStep3')}</li>
                            <li>{t('techStep4')}</li>
                            <li><span className="font-bold">{t('techTechnologies')}</span>: {t('techPhase5Desc')}</li>
                        </ul>
                        <h4 className="font-bold text-slate-200 mt-6 mb-2">Tecnologías Utilizadas</h4>
                        <p className="text-sm text-slate-400 font-sans">Google Gemini, React, TypeScript, TailwindCSS, OpenStreetMap</p>
                    </div>
                );
        }
    };

    const TabButton: React.FC<{ tab: Tab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab 
                ? 'bg-cyan-500/20 text-cyan-300' 
                : 'text-slate-400 hover:bg-slate-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl max-w-2xl w-full relative font-mono">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                    <XCircleIcon className="h-7 w-7" />
                </button>
                <div className="p-6 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 font-header mb-4">
                        {t('infoTitle')}
                    </h2>

                    <div className="border-b border-slate-700 mb-4">
                        <nav className="flex space-x-2">
                            <TabButton tab="about" label={t('aboutTab')} />
                            <TabButton tab="help" label={t('helpTab')} />
                            <TabButton tab="tech" label={t('techInfoTab')} />
                        </nav>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {renderContent()}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default InfoModal;
