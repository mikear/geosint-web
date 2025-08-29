
import React, { useState, useEffect } from 'react';
import { AnalysisPhase } from '../services/backendService';

interface AnalysisInProgressProps {
    imageUrl: string;
    phase: AnalysisPhase;
    t: (key: 'phaseQueries' | 'phaseVerification' | 'phaseSynthesis') => string;
}

const AnalysisInProgress: React.FC<AnalysisInProgressProps> = ({ imageUrl, phase, t }) => {
    const getProgressClass = () => {
        switch (phase) {
            case 'queries': return 'w-1/3';
            case 'verification': return 'w-2/3';
            case 'synthesis': return 'w-full';
            default: return 'w-0';
        }
    };

    const getPhaseText = () => {
        switch (phase) {
            case 'queries': return t('phaseQueries');
            case 'verification': return t('phaseVerification');
            case 'synthesis': return t('phaseSynthesis');
            default: return '';
        }
    };

    return (
        <div className="w-full mt-8 flex flex-col items-center animate-fade-in">
            <div className="relative w-full max-w-lg mx-auto overflow-hidden rounded-lg shadow-lg border-2 border-cyan-500/50 group animate-pulse-border">
                <img src={imageUrl} alt="Analizando imagen" className="w-full h-auto object-contain max-h-[50vh] transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-slate-900/10"></div>
                <div className="scan-line"></div>
                <div className="scan-grid"></div>
                <div className="corner-bracket top-left"></div>
                <div className="corner-bracket top-right"></div>
                <div className="corner-bracket bottom-left"></div>
                <div className="corner-bracket bottom-right"></div>
            </div>
            <div className="mt-6 text-center w-full">
                <p className="text-lg font-medium text-cyan-300 font-mono tracking-wider min-h-[28px]">{getPhaseText()}</p>
                <div className="mt-3 w-full max-w-sm bg-slate-700 rounded-full h-2.5 mx-auto overflow-hidden">
                    <div className={`bg-gradient-to-r from-purple-500 to-cyan-400 h-2.5 rounded-full transition-all duration-1000 ease-out ${getProgressClass()}`}></div>
                </div>
            </div>
            <style>{`
                .scan-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(to right, transparent, rgba(0, 255, 255, 0.9), transparent);
                    box-shadow: 0 0 15px 2px rgba(0, 255, 255, 0.6);
                    animation: scan-anim 3s linear infinite;
                    transform: rotate(5deg) scaleX(1.5);
                    opacity: 0.8;
                }

                .scan-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(0, 255, 255, 0.15) 1px, transparent 1px),
                        linear-gradient(to right, rgba(0, 255, 255, 0.15) 1px, transparent 1px);
                    background-size: 40px 40px;
                    animation: flicker 0.2s infinite;
                }
                
                .corner-bracket {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-style: solid;
                    border-color: rgba(0, 255, 255, 0.7);
                }
                .top-left { top: 10px; left: 10px; border-width: 3px 0 0 3px; }
                .top-right { top: 10px; right: 10px; border-width: 3px 3px 0 0; }
                .bottom-left { bottom: 10px; left: 10px; border-width: 0 0 3px 3px; }
                .bottom-right { bottom: 10px; right: 10px; border-width: 0 3px 3px 0; }

                @keyframes scan-anim {
                    0% { transform: translateY(-20px) rotate(5deg) scaleX(1.5); }
                    100% { transform: translateY(calc(100% + 20px)) rotate(5deg) scaleX(1.5); }
                }

                @keyframes flicker {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
                
                @keyframes pulse-border {
                    0%, 100% { border-color: rgba(0, 255, 255, 0.4); box-shadow: 0 0 10px rgba(0, 255, 255, 0.2); }
                    50% { border-color: rgba(0, 255, 255, 0.8); box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
                }
                .animate-pulse-border {
                    animation: pulse-border 2s infinite;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AnalysisInProgress;
