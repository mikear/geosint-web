
import React from 'react';
import { GitHubIcon, LinkedInIcon } from './Icons';

type Translator = (key: string) => string;

interface TermsOfUseModalProps {
    onAccept: () => void;
    t: Translator;
}

const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ onAccept, t }) => {
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 font-mono">
                <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 font-header mb-4">
                    {t('termsTitle')}
                </h2>

                <div className="space-y-4 text-slate-300 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <h3 className="font-bold text-cyan-400">{t('termsResponsibleUse')}</h3>
                        <p className="text-sm mt-1">{t('termsResponsibleUseDesc')}</p>
                    </div>
                     <div>
                        <h3 className="font-bold text-cyan-400">{t('termsPrivacy')}</h3>
                        <p className="text-sm mt-1">{t('termsPrivacyDesc')}</p>
                    </div>
                     <div>
                        <h3 className="font-bold text-cyan-400">{t('termsDeveloper')}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                           <span className="text-sm">Diego A. Rábalo</span>
                           <a href="https://github.com/mikear" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-300 transition-colors"><GitHubIcon className="h-5 w-5" /></a>
                           <a href="https://www.linkedin.com/in/rabalo" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-300 transition-colors"><LinkedInIcon className="h-5 w-5" /></a>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={onAccept}
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 shadow-lg shadow-purple-500/20 font-header"
                    >
                        {t('termsAcceptButton')}
                    </button>
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

export default TermsOfUseModal;