

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SearchQuery } from '../types';
import { Language } from '../i18n';

// --- CONFIGURACIÓN DEL BACKEND SIMULADO ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("La variable de entorno API_KEY no está configurada.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

// --- DEFINICIONES DE ESQUEMAS ---
const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING },
        description: { type: Type.STRING },
        confidenceScore: { type: Type.NUMBER },
        forensicAnalysis: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                isAltered: { type: Type.BOOLEAN },
                alterationConfidence: { type: Type.NUMBER }
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


// --- FUNCIONES INTERNAS DEL SERVICIO ---

const getPrompts = (lang: Language) => {
    const prompts = {
        en: {
            synthesis: `Act as 'GeoCognition AI', a geospatial intelligence system. Your mission is to generate a final report by analyzing an image.
            **Your Task:**
            1.  **Final Conclusion:** Determine the most likely location. Provide the most specific, recognizable place name possible (e.g., "Bárcena Mayor, Cantabria") instead of generic descriptions.
            2.  **Forensic Analysis (AI/Alteration):** Inspect the image for artifacts of AI generation or digital manipulation. Assess its authenticity.
            3.  **Environment Analysis (Indoor/Outdoor):** Determine if the scene is indoor or outdoor and explain the implications for geolocation.
            4.  **Confidence Score:** Calculate this based on the uniqueness and clarity of identifiable features. A famous landmark in high resolution should be 90-95%. A specific but less known place (like a particular street corner) 75-85%. A generic landscape (forest, beach) with few unique features 40-60%. If you cannot determine a location, the score should be below 20%.
            Generate your report in the requested JSON format. If the data is inconclusive, state it clearly. Respond in English.`
        },
        es: {
            synthesis: `Actúa como 'GeoCognition AI', un sistema de inteligencia geoespacial. Tu misión es generar un informe final analizando una imagen.
            **Tu Tarea:**
            1.  **Conclusión Final:** Determina la ubicación más probable. Proporciona el nombre del lugar más específico y reconocible posible (ej: "Bárcena Mayor, Cantabria") en lugar de descripciones genéricas.
            2.  **Análisis Forense (IA/Alteración):** Inspecciona la imagen en busca de artefactos de generación por IA o manipulación digital. Evalúa su autenticidad.
            3.  **Análisis de Entorno (Interior/Exterior):** Determina si la escena es interior o exterior y explica las implicaciones para la geolocalización.
            4.  **Nivel de Confianza:** Calcúlalo basándote en la singularidad y claridad de las características identificables. Un monumento famoso en alta resolución debería tener un 90-95%. Un lugar específico pero menos conocido (como una esquina particular) un 75-85%. Un paisaje genérico (bosque, playa) con pocas características únicas un 40-60%. Si no puedes determinar una ubicación, la puntuación debe ser inferior al 20%.
            Genera tu informe en el formato JSON solicitado. Si los datos no son concluyentes, indícalo claramente. Responde en español.`
        },
        zh: {
            synthesis: `扮演‘地理认知AI’，一个地理空间情报系统。您的任务是通过分析图像生成最终报告。
            **您的任务：**
            1. **最终结论：** 确定最可能的位置。提供最具体、最可识别的地名（例如，“坎塔布里亚的巴尔塞纳马约尔”），而不是通用的描述。
            2. **法证分析（AI/篡改）：** 检查图像中是否存在AI生成或数字篡改的痕迹。评估其真实性。
            3. **环境分析（室内/室外）：** 判断场景是室内还是室外，并解释其对地理定位的影响。
            4. **置信度分数：** 根据可识别特征的独特性和清晰度进行计算。高分辨率的著名地标应为90-95%。特定但不太知名的地点（如某个街角）为75-85%。几乎没有独特特征的普通景观（森林、海滩）为40-60%。如果无法确定位置，分数应低于20%。
            以请求的JSON格式生成您的报告。如果数据不确定，请明确说明。请用中文回答。`
        },
        hi: {
            synthesis: `‘जियोकॉग्निशन एआई’ के रूप में कार्य करें, जो एक भू-स्थानिक खुफिया प्रणाली है। आपका मिशन एक छवि का विश्लेषण करके एक अंतिम रिपोर्ट तैयार करना है।
            **आपका कार्य:**
            1. **अंतिम निष्कर्ष:** सबसे संभावित स्थान का निर्धारण करें। सामान्य विवरणों के बजाय सबसे विशिष्ट, पहचानने योग्य स्थान का नाम प्रदान करें (जैसे, "बार्सेना मेयर, कैंटैब्रिया")।
            2. **फोरेंसिक विश्लेषण (एआई/परिवर्तन):** एआई पीढ़ी या डिजिटल हेरफेर की कलाकृतियों के लिए छवि का निरीक्षण करें। इसकी प्रामाणिकता का आकलन करें।
            3. **पर्यावरण विश्लेषण (इनडोर/आउटडोर):** निर्धारित करें कि दृश्य इनडोर है या आउटडोर और जियोलोकेशन के लिए निहितार्थों की व्याख्या करें।
            4. **विश्वास स्कोर:** इसे पहचानने योग्य विशेषताओं की विशिष्टता और स्पष्टता के आधार पर गणना करें। उच्च रिज़ॉल्यूशन में एक प्रसिद्ध स्थलचिह्न 90-95% होना चाहिए। एक विशिष्ट लेकिन कम ज्ञात स्थान (जैसे एक विशेष सड़क का कोना) 75-85%। कुछ अनूठी विशेषताओं वाला एक सामान्य परिदृश्य (जंगल, समुद्र तट) 40-60%। यदि आप किसी स्थान का निर्धारण नहीं कर सकते हैं, तो स्कोर 20% से कम होना चाहिए।
            अनुरोधित JSON प्रारूप में अपनी रिपोर्ट तैयार करें। यदि डेटा अनिर्णायक है, तो इसे स्पष्ट रूप से बताएं। कृपया हिंदी में उत्तर दें।`
        },
        fr: {
            synthesis: `Agissez en tant que 'GeoCognition AI', un système d'intelligence géospatiale. Votre mission est de générer un rapport final en analysant une image.
            **Votre Tâche :**
            1. **Conclusion Finale :** Déterminez l'emplacement le plus probable. Fournissez le nom de lieu le plus spécifique et reconnaissable possible (par ex., "Bárcena Mayor, Cantabrie") au lieu de descriptions génériques.
            2. **Analyse Forensique (IA/Altération) :** Inspectez l'image à la recherche d'artefacts de génération par IA ou de manipulation numérique. Évaluez son authenticité.
            3. **Analyse de l'Environnement (Intérieur/Extérieur) :** Déterminez si la scène est à l'intérieur ou à l'extérieur et expliquez les implications pour la géolocalisation.
            4. **Score de Confiance :** Calculez-le en fonction de l'unicité et de la clarté des éléments identifiables. Un monument célèbre en haute résolution devrait obtenir 90-95%. Un endroit spécifique mais moins connu (comme un coin de rue particulier) 75-85%. Un paysage générique (forêt, plage) avec peu de caractéristiques uniques 40-60%. Si vous ne pouvez pas déterminer un emplacement, le score doit être inférieur à 20%.
            Générez votre rapport au format JSON demandé. Si les données ne sont pas concluantes, indiquez-le clairement. Répondez en français.`
        },
        ru: {
            synthesis: `Действуйте как 'GeoCognition AI', геопространственная разведывательная система. Ваша миссия — составить итоговый отчет на основе анализа изображения.
            **Ваша задача:**
            1.  **Окончательный вывод:** Определите наиболее вероятное местоположение. Укажите наиболее конкретное и узнаваемое название места (например, "Барсена-Майор, Кантабрия"), а не общие описания.
            2.  **Криминалистический анализ (ИИ/Изменение):** Осмотрите изображение на наличие артефактов генерации ИИ или цифровой обработки. Оцените его подлинность.
            3.  **Анализ окружения (В помещении/На улице):** Определите, находится ли сцена в помещении или на улице, и объясните последствия для геолокации.
            4.  **Оценка достоверности:** Рассчитайте ее на основе уникальности и четкости опознаваемых признаков. Известная достопримечательность в высоком разрешении должна иметь оценку 90-95%. Конкретное, но менее известное место (например, определенный угол улицы) — 75-85%. Обычный пейзаж (лес, пляж) с небольшим количеством уникальных черт — 40-60%. Если вы не можете определить местоположение, оценка должна быть ниже 20%.
            Создайте отчет в запрашиваемом формате JSON. Если данные неубедительны, четко укажите это. Отвечайте на русском языке.`
        },
        pt: {
            synthesis: `Aja como 'GeoCognition AI', um sistema de inteligência geoespacial. Sua missão é gerar um relatório final analisando uma imagem.
            **Sua Tarefa:**
            1.  **Conclusão Final:** Determine a localização mais provável. Forneça o nome do local mais específico e reconhecível possível (por exemplo, "Bárcena Mayor, Cantábria") em vez de descrições genéricas.
            2.  **Análise Forense (IA/Alteração):** Inspecione a imagem em busca de artefatos de geração por IA ou manipulação digital. Avalie sua autenticidade.
            3.  **Análise do Ambiente (Interior/Exterior):** Determine se a cena é interna ou externa e explique as implicações para a geolocalização.
            4.  **Pontuação de Confiança:** Calcule-a com base na singularidade e clareza das características identificáveis. Um marco famoso em alta resolução deve ter 90-95%. Um local específico mas menos conhecido (como uma esquina específica) 75-85%. Uma paisagem genérica (floresta, praia) com poucas características únicas 40-60%. Se não conseguir determinar uma localização, a pontuação deve ser inferior a 20%.
            Gere seu relatório no formato JSON solicitado. Se os dados forem inconclusivos, declare isso claramente. Responda em português.`
        }
    };
    return prompts[lang] || prompts.en;
}


const _synthesizeFinalReport = async (base64ImageData: string, mimeType: string, lang: Language): Promise<AnalysisResult> => {
    const { synthesis } = getPrompts(lang);
    const imagePart = { inlineData: { data: base64ImageData, mimeType: mimeType } };
    const textPart = { text: synthesis };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: { responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.2 }
    });
    return JSON.parse(response.text.trim()) as AnalysisResult;
};


// --- FUNCIÓN PÚBLICA (Endpoint del Backend Simulado) ---

export type AnalysisPhase = 'queries' | 'verification' | 'synthesis';

/**
 * Orquesta el proceso de análisis completo.
 * @param base64ImageData La imagen codificada en base64.
 * @param mimeType El tipo MIME de la imagen.
 * @param onPhaseChange Un callback para notificar al frontend sobre el cambio de fase.
 * @param lang El idioma para el informe.
 * @returns Una promesa que se resuelve con el informe final.
 */
export const runFullAnalysis = async (
    base64ImageData: string,
    mimeType: string,
    onPhaseChange: (phase: AnalysisPhase) => void,
    lang: Language
): Promise<{ finalReport: AnalysisResult }> => {
    try {
        onPhaseChange('queries'); // Fase 1: Preparación
        await new Promise(resolve => setTimeout(resolve, 500)); // Simula trabajo inicial

        onPhaseChange('verification'); // Fase 2: El trabajo pesado de la IA
        const finalReport = await _synthesizeFinalReport(base64ImageData, mimeType, lang);
        
        if (!finalReport.locationName || !finalReport.description || finalReport.confidenceScore === undefined) {
            throw new Error("La respuesta final de la API no tiene el formato esperado.");
        }
        
        onPhaseChange('synthesis'); // Fase 3: Finalización
        await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa para que el usuario vea la barra al 100%

        return { finalReport };

    } catch (error) {
        console.error("Error en el servicio de backend:", error);
        throw error;
    }
};