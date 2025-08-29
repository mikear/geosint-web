import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from '../types';
import { Language } from '../i18n';

// --- CONFIGURATION ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

// --- RETRY LOGIC CONFIG ---
const MAX_RETRIES = 5; // Total attempts = 1 initial + 4 retries
const INITIAL_BACKOFF_MS = 3000; // Start with a 3-second delay

// --- TYPE DEFINITIONS ---
export type AnalysisPhase = 'initialization' | 'featureExtraction' | 'hypothesisGeneration' | 'synthesis';

// --- HELPER FUNCTIONS ---

/**
 * Pauses execution for a specified duration.
 * @param ms The number of milliseconds to wait.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A wrapper for the Gemini API call that includes robust retry logic with exponential backoff.
 * This makes the application resilient to temporary rate limit errors (429) and handles
 * specific permanent errors like invalid API keys.
 * @param request The request object for the generateContent call.
 * @returns A promise that resolves with the API response.
 */
const generateContentWithRetry = async (request: any): Promise<GenerateContentResponse> => {
    let lastError: any = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await ai.models.generateContent(request);
        } catch (error: any) {
            lastError = error;
            // The error object from the SDK might be complex. Stringify to inspect it safely.
            const errorString = (typeof error === 'object' && error !== null) ? JSON.stringify(error) : String(error);
            const lowerErrorString = errorString.toLowerCase();

            // Check for retriable 429 Resource Exhausted errors (rate limiting/quota)
            if (lowerErrorString.includes('429') || lowerErrorString.includes('resource_exhausted')) {
                if (attempt < MAX_RETRIES - 1) {
                    const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                    console.warn(`API rate limit hit. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
                    await delay(backoffTime);
                    continue; // Continue to the next iteration of the loop
                } else {
                    console.error(`All retry attempts failed for quota error.`, lastError);
                    throw new Error("QUOTA_EXCEEDED"); // Final attempt failed, throw specific error.
                }
            } 
            // Check for non-retriable auth errors
            else if (lowerErrorString.includes('400') && (lowerErrorString.includes('api key not valid') || lowerErrorString.includes('invalid api key'))) {
                 console.error("Invalid API Key detected.", lastError);
                 throw new Error("INVALID_API_KEY");
            }
            // For other errors, fail immediately.
            else {
                console.error("A non-retriable API error occurred:", lastError);
                throw lastError; // Rethrow original error for generic handling.
            }
        }
    }
    // This part should be unreachable, but acts as a failsafe.
    throw lastError || new Error("GENERIC_ERROR");
};


// --- PROMPT ENGINEERING ---
const getPrompts = (lang: Language, features: string = '', hypothesis: string = '', exifData: any = null) => {
    const langMap: { [key in Language]: string } = {
        en: 'English', es: 'Spanish', zh: 'Chinese', hi: 'Hindi',
        fr: 'French', ru: 'Russian', pt: 'Portuguese'
    };
    const languageName = langMap[lang] || 'English';

    const exifPreamble = (exifData && exifData.latitude && exifData.longitude)
        ? `CRITICAL CONTEXT: This image contains trusted EXIF GPS data. Latitude: ${exifData.latitude}, Longitude: ${exifData.longitude}. You MUST prioritize this as the ground-truth location. Your primary task is to identify and describe the scene and any notable subjects at this exact location.`
        : '';

    return {
        featureExtraction: `Analyze this image to identify key visual and contextual features for a full intelligence report. List any specific landmarks, architectural styles, text (signs, license plates), native vegetation, unique geographical formations, cultural clues, notable public figures or celebrities, and any indication of specific events or activities. Output as a concise summary. Do not guess the final location. Respond in ${languageName}.`,
        
        hypothesisGeneration: `Based on these visual features: '${features}'. Use Google Search to determine the most probable specific location (city, neighborhood, or landmark). Provide only the location name. Respond in ${languageName}.`,
        
        synthesis: `${exifPreamble}
Act as 'GeoCognition AI', a world-class geospatial and cultural intelligence system. Based on the provided image and a location hypothesis of '${hypothesis}', your mission is to generate a final, comprehensive report.
**Your Task:**
1.  **Location Analysis:** If EXIF data was provided, use it as the ground truth to state the specific location name (e.g., "Casa Rosada, Buenos Aires, Argentina"). If no EXIF was provided, critically evaluate the '${hypothesis}', correct it if necessary, and provide the most specific location name possible.
2.  **Detailed Description & Contextual Analysis:** Provide a rich description of the scene. Identify the primary subjects and activity. **Crucially, if any public figures, celebrities, or other notable individuals are present, you MUST identify them by name and provide their relevant role or context (e.g., "Javier Milei, President of Argentina").** Explain how visual evidence from the image supports all your conclusions (about location, people, and context).
3.  **Forensic Analysis (AI/Alteration):** Meticulously inspect the image for tell-tale signs of AI generation or digital manipulation. Look for common artifacts such as inconsistent lighting and shadows, unnatural textures (especially on skin, hair, and hands), distorted or nonsensical text in the background, illogical object-blending, and repeating patterns. State your assessment of its authenticity based on these specific points.
4.  **Environment Analysis (Indoor/Outdoor):** Determine if the scene is indoor or outdoor and explain the implications for analysis.
5.  **Confidence Score:** Calculate this based on the clarity of all identifiable features (location, people, objects). If EXIF data is used, location confidence is intrinsically high; focus the score on the confidence of the contextual analysis. A famous landmark with a clearly identifiable famous person should be 95-100%. A generic landscape is 40-60%. If uncertain about context or location, the score must be below 40%.
Generate your report in the requested JSON format. Respond in ${languageName}.`
    };
};

// --- SCHEMA DEFINITIONS ---
const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING },
        description: { type: Type.STRING },
        confidenceScore: { type: Type.NUMBER, description: "A number between 0 and 100." },
        forensicAnalysis: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                isAltered: { type: Type.BOOLEAN },
                alterationConfidence: { type: Type.NUMBER, description: "A number between 0 and 100. Should be 0 if isAltered is false." }
            },
            required: ["summary", "isAltered", "alterationConfidence"]
        },
        environmentAnalysis: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ['interior', 'exterior', 'desconocido'] },
                details: { type: Type.STRING }
            },
            required: ["type", "details"]
        }
    },
    required: ["locationName", "description", "confidenceScore", "forensicAnalysis", "environmentAnalysis"]
};

// --- INTERNAL SERVICE FUNCTIONS ---

const _extractVisualFeatures = async (base64ImageData: string, mimeType: string, lang: Language): Promise<string> => {
    const prompts = getPrompts(lang);
    const response = await generateContentWithRetry({
        model: model,
        contents: { parts: [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
            { text: prompts.featureExtraction }
        ]},
        config: { temperature: 0.1 }
    });
    return response.text;
};

const _generateHypothesisWithSearch = async (features: string, lang: Language): Promise<GenerateContentResponse> => {
    const prompts = getPrompts(lang, features);
    const response = await generateContentWithRetry({
        model: model,
        contents: prompts.hypothesisGeneration,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    return response;
};

const _synthesizeFinalReport = async (base64ImageData: string, mimeType: string, hypothesis: string, lang: Language, exifData?: any): Promise<AnalysisResult> => {
    const prompts = getPrompts(lang, '', hypothesis, exifData);
    const response = await generateContentWithRetry({
        model: model,
        contents: { parts: [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
            { text: prompts.synthesis }
        ]},
        config: { responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.2 }
    });
    
    try {
        return JSON.parse(response.text.trim()) as AnalysisResult;
    } catch (e) {
        console.error("Failed to parse final report JSON:", response.text);
        throw new Error("INVALID_RESPONSE_FORMAT");
    }
};

// --- PUBLIC FUNCTION (Simulated Backend Endpoint) ---

/**
 * Orchestrates the full analysis process using a multi-step triangulation approach.
 * @param base64ImageData The base64 encoded image.
 * @param mimeType The MIME type of the image.
 * @param onPhaseChange A callback to notify the frontend of phase changes.
 * @param lang The language for the report.
 * @param exifData Optional EXIF data from the image file.
 * @returns A promise that resolves with the final analysis report.
 */
export const runFullAnalysis = async (
    base64ImageData: string,
    mimeType: string,
    onPhaseChange: (phase: AnalysisPhase) => void,
    lang: Language,
    exifData?: any
): Promise<{ finalReport: AnalysisResult }> => {
    try {
        let hypothesis: string;
        let groundingChunks: any = null;

        if (exifData && exifData.latitude && exifData.longitude) {
            // EXIF GPS is available. Use it as the ground truth.
            // We can skip feature extraction and hypothesis generation for geolocation.
            hypothesis = `Location at GPS coordinates: ${exifData.latitude}, ${exifData.longitude}`;
            // We still inform the UI of progress, but we can jump to synthesis
            onPhaseChange('featureExtraction');
            onPhaseChange('hypothesisGeneration');
        } else {
            // No EXIF GPS, run the full visual analysis pipeline.
            onPhaseChange('featureExtraction');
            const features = await _extractVisualFeatures(base64ImageData, mimeType, lang);

            onPhaseChange('hypothesisGeneration');
            const hypothesisResponse = await _generateHypothesisWithSearch(features, lang);
            hypothesis = hypothesisResponse.text.trim();
            groundingChunks = hypothesisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        }

        onPhaseChange('synthesis');
        const finalReport = await _synthesizeFinalReport(base64ImageData, mimeType, hypothesis, lang, exifData);

        // Format and attach grounding sources
        if (groundingChunks) {
            finalReport.groundingSources = groundingChunks
                .filter((chunk: any) => chunk.web && chunk.web.uri && chunk.web.title)
                .map((chunk: any) => ({
                    uri: chunk.web.uri,
                    title: chunk.web.title
                }));
        }

        if (!finalReport.locationName || !finalReport.description || finalReport.confidenceScore === undefined) {
            throw new Error("INVALID_RESPONSE_FORMAT");
        }

        return { finalReport };

    } catch (error) {
        console.error("Error in backend service:", error);
        // The `generateContentWithRetry` function now throws specific error messages.
        // We just need to catch them and rethrow, or wrap any other unexpected errors.
        if (error instanceof Error) {
            if (['INVALID_API_KEY', 'QUOTA_EXCEEDED', 'INVALID_RESPONSE_FORMAT'].includes(error.message)) {
                throw error; // Rethrow the specific error for the frontend to handle.
            }
        }
        // If the error is not one of our specific types, wrap it in a generic one.
        throw new Error("GENERIC_ERROR");
    }
};