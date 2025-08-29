import React, { useState, useRef, useEffect } from 'react';
import { GlobeIcon } from './Icons';
import { Language } from '../i18n';
import ReactCountryFlag from 'react-country-flag';

interface LanguageSelectorProps {
    selectedLanguage: Language;
    onLanguageChange: (lang: Language) => void;
}

const languages: { code: Language; name: string; country_code: string }[] = [
    { code: 'en', name: 'English', country_code: 'US' },
    { code: 'es', name: 'Español', country_code: 'ES' },
    { code: 'zh', name: '中文', country_code: 'CN' },
    { code: 'hi', name: 'हिन्दी', country_code: 'IN' },
    { code: 'fr', name: 'Français', country_code: 'FR' },
    { code: 'ru', name: 'Русский', country_code: 'RU' },
    { code: 'pt', name: 'Português', country_code: 'PT' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLanguageSelect = (lang: Language) => {
        onLanguageChange(lang);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedLang = languages.find(l => l.code === selectedLanguage);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {selectedLang && <ReactCountryFlag countryCode={selectedLang.country_code} svg style={{ width: '1.25em', height: '1.25em' }} />}
                <span className="text-sm font-medium text-white uppercase">{selectedLanguage}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-10 animate-fade-in-down">
                    <ul className="py-1">
                        {languages.map((lang) => (
                            <li key={lang.code}>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleLanguageSelect(lang.code);
                                    }}
                                    className={`flex items-center px-4 py-2 text-sm ${selectedLanguage === lang.code ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'} hover:bg-slate-700`}
                                >
                                    <ReactCountryFlag countryCode={lang.country_code} svg style={{ width: '1.25em', height: '1.25em', marginRight: '0.75rem' }} />
                                    <span>{lang.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default LanguageSelector;