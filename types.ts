
export interface SearchQuery {
    query: string;
    type: 'landmark' | 'text' | 'object' | 'context';
    reason: string;
}

export interface ForensicAnalysisResult {
    summary: string;
    isAltered: boolean;
    alterationConfidence: number;
}

export interface AnalysisResult {
    locationName: string;
    description: string;
    confidenceScore: number;
    forensicAnalysis: ForensicAnalysisResult;
    environmentAnalysis: {
        type: 'interior' | 'exterior' | 'desconocido';
        details: string;
    };
    groundingSources?: Array<{
        uri: string;
        title: string;
    }>;
}
