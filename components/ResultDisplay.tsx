
import React from 'react';
import { AnalysisResult } from '../types';

interface ResultDisplayProps {
    data: AnalysisResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => {
    return (
        <div className="w-full animate-fade-in">
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg shadow-lg p-6 border border-slate-600">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-300">
                    {data.locationName}
                </h2>
                <p className="mt-4 text-slate-300 leading-relaxed">
                    {data.description}
                </p>
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

export default ResultDisplay;