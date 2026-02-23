
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Animal, LogType, AnimalCategory, ConservationStatus, HazardRating } from "../types";

// Singleton instance for AI client
let aiInstance: GoogleGenAI | null = null;

/**
 * Initializes or retrieves the Gemini API client
 */
const getAi = () => {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    aiInstance = new GoogleGenAI({ apiKey: apiKey });
  }
  return aiInstance;
};

/**
 * Helper to normalize string input to a ConservationStatus enum value
 */
const normalizeIUCNStatus = (input: string): ConservationStatus => {
  const s = input.trim().toUpperCase();
  if (s === 'LC' || s.includes('LEAST CONCERN')) return ConservationStatus.LC;
  if (s === 'NT' || s.includes('NEAR THREATENED')) return ConservationStatus.NT;
  if (s === 'VU' || s.includes('VULNERABLE')) return ConservationStatus.VU;
  if (s === 'EN' || s.includes('ENDANGERED') && !s.includes('CRITICALLY')) return ConservationStatus.EN;
  if (s === 'CR' || s.includes('CRITICALLY ENDANGERED')) return ConservationStatus.CR;
  if (s === 'EW' || s.includes('EXTINCT IN THE WILD')) return ConservationStatus.EW;
  if (s === 'EX' || s.includes('EXTINCT') && !s.includes('WILD')) return ConservationStatus.EX;
  if (s === 'DD' || s.includes('DATA DEFICIENT')) return ConservationStatus.DD;
  return ConservationStatus.NE;
};

/**
 * Helper to normalize string input to a HazardRating enum value
 */
const normalizeHazardRating = (input: string): HazardRating => {
    const s = input.trim().toUpperCase();
    if (s === 'HIGH') return HazardRating.HIGH;
    if (s === 'MEDIUM') return HazardRating.MEDIUM;
    if (s === 'LOW') return HazardRating.LOW;
    return HazardRating.NONE;
};

/**
 * Helper for exponential backoff retries
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimited = error.message?.includes('429') || error.status === 429;
    const isServiceUnavailable = error.message?.includes('503') || error.status === 503 || error.status === 'UNAVAILABLE';
    
    if (retries > 0 && (isRateLimited || isServiceUnavailable)) {
      console.warn(`Gemini API issue (${error.status || 'transient'}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry<T>(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Fetches comprehensive species details for statutory registry
 */
export const getSpeciesDetails = async (species: string): Promise<{
    latinName?: string;
    conservationStatus?: ConservationStatus;
    hazardRating?: HazardRating;
    isVenomous?: boolean;
  }> => {
    if (!species.trim()) return {};
    const ai = getAi();
    try {
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Analyze the animal species "${species}" for zoo statutory registry purposes.
        
        Provide the following data in JSON format:
        - latinName: Scientific name (string)
        - conservationStatus: IUCN Red List Code (e.g. LC, NT, VU, EN, CR, EW, EX, DD, NE)
        - hazardRating: Risk level for handlers (Low, Medium, High). High = dangerous carnivores, venomous, or large raptors.
        - isVenomous: boolean (true if venomous/poisonous)
  
        Return ONLY valid JSON.`,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      }));
      
      try {
          const data = JSON.parse(response.text || '{}');
          return {
              latinName: data.latinName,
              conservationStatus: data.conservationStatus ? normalizeIUCNStatus(data.conservationStatus) : undefined,
              hazardRating: data.hazardRating ? normalizeHazardRating(data.hazardRating) : undefined,
              isVenomous: data.isVenomous
          };
      } catch (e) {
          console.error("JSON Parse Error", e);
          return {};
      }
    } catch (error) {
      console.error("Gemini Error (getSpeciesDetails):", error);
      return {};
    }
  };

/**
 * Fetches the scientific Latin name for a given species
 */
export const getLatinName = async (species: string): Promise<string | null> => {
  if (!species.trim()) return null;
  const ai = getAi();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Provide only the scientific (Latin) name for the species: "${species}". Return only the name, no extra text.`,
      config: {
        temperature: 0.1,
      }
    }));
    return response.text?.trim() || null;
  } catch (error) {
    console.error("Gemini Error (getLatinName):", error);
    return null;
  }
};

/**
 * Fetches the IUCN Red List status for a given species
 */
export const getConservationStatus = async (species: string): Promise<ConservationStatus | null> => {
  if (!species.trim()) return null;
  const ai = getAi();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Identify the current official IUCN Red List conservation status for the species: "${species}". 
      Return ONLY the label (e.g. "Least Concern") or the code (e.g. "LC").`,
      config: {
        temperature: 0.1,
      }
    }));
    const statusText = response.text?.trim();
    if (!statusText) return null;

    return normalizeIUCNStatus(statusText);
  } catch (error) {
    console.error("Gemini Error (getConservationStatus):", error);
    return null;
  }
};

/**
 * Batch version of species intelligence fetching
 */
export const batchGetSpeciesData = async (speciesList: string[]): Promise<Record<string, { latin?: string, status?: ConservationStatus }>> => {
  if (speciesList.length === 0) return {};
  const ai = getAi();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `For the following list of animal species, provide their scientific (Latin) name and their current official IUCN Red List conservation status.
      
      Species List: ${speciesList.join(', ')}
      
      Return the data as a JSON object where keys are the original species names from the list.
      Values must be objects with:
      - "latin": string
      - "status": string

      Return ONLY the JSON object.`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    }));
    
    try {
        const rawJson = JSON.parse(response.text || '{}');
        const normalized: Record<string, { latin?: string, status?: ConservationStatus }> = {};
        
        Object.keys(rawJson).forEach(species => {
          normalized[species] = {
            latin: rawJson[species].latin,
            status: rawJson[species].status ? normalizeIUCNStatus(rawJson[species].status) : undefined
          };
        });
        
        return normalized;
    } catch (e) {
        return {};
    }
  } catch (error) {
    return {};
  }
};

/**
 * Generates specific content for the Enclosure Sign
 */
export const generateSignageContent = async (species: string): Promise<{ 
    diet: string[], 
    habitat: string[], 
    didYouKnow: string[],
    wildOrigin: string,
    speciesStats: { lifespanWild: string, lifespanCaptivity: string, wingspan: string, weight: string } 
}> => {
  const ai = getAi();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `For the animal species "${species}", provide content for a zoo enclosure sign.
      
      I need:
      1. DIET: Exactly 2 points.
      2. HABITAT: Exactly 3 points.
      3. DID YOU KNOW: Exactly 2 facts.
      4. WILD ORIGIN: Max 5 words.
      5. STATS: Wild Lifespan, Captivity Lifespan, Wingspan/Length, Weight.

      Return purely valid JSON.`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    }));

    return JSON.parse(response.text || '{"diet":[], "habitat":[], "didYouKnow":[], "wildOrigin": "", "speciesStats":{}}');
  } catch (error) {
    return { 
        diet: [], 
        habitat: [], 
        didYouKnow: [],
        wildOrigin: "",
        speciesStats: { lifespanWild: '-', lifespanCaptivity: '-', wingspan: '-', weight: '-' } 
    };
  }
};

/**
 * AI Weather Analysis for Flight Displays
 */
export const analyzeFlightWeather = async (hourlyData: any[]): Promise<string> => {
  const ai = getAi();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `You are a professional Falconer and Safety Officer. Review this 24h weather data: ${JSON.stringify(hourlyData.slice(0, 24))}.
      Provide a "Flight Safety Briefing" for today.
      Identify:
      1. A SAFETY INDEX (1-10) where 10 is perfect conditions.
      2. OPERATIONAL WINDOWS (best times to fly).
      3. HAZARDS (gusts, heavy rain, extreme heat/cold for specific birds like Barn Owls or Eagles).
      4. VERDICT (Go/No-Go/Caution).
      Format with clear bold headers and bullet points. Maximum 150 words.`,
    }));
    return response.text || "Flight analysis engine unavailable.";
  } catch (error) {
    console.error("Gemini Error (analyzeFlightWeather):", error);
    return "Weather analysis engine is currently offline.";
  }
};

/**
 * Operational summaries and clinical analysis
 */
export const generateSectionSummary = async (category: AnimalCategory, animals: Animal[]): Promise<string> => {
  const ai = getAi();
  const context = animals.map(a => ({
    name: a.name,
    species: a.species,
    lastWeight: a.logs?.find(l => l.type === LogType.WEIGHT)?.value,
  }));
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Provide a professional operational status report for the ${category} section: ${JSON.stringify(context)}.`,
    }));
    return response.text || "Summary unavailable.";
  } catch (error) { return "Summary unavailable."; }
};

export const analyzeHealthHistory = async (animal: Animal): Promise<string> => {
  const ai = getAi();
  const healthLogs = (animal.logs || []).filter(l => l.type === LogType.HEALTH || l.type === LogType.WEIGHT).slice(0, 15);
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Analyze history for "${animal.name}" (${animal.species}): ${JSON.stringify(healthLogs)}.`,
    }));
    return response.text || "Analysis unavailable.";
  } catch (error) { return "Analysis unavailable."; }
};

export const analyzeCollectionHealth = async (animals: Animal[]): Promise<string> => {
  const ai = getAi();
  const context = animals.filter(a => !a.archived).map(a => ({ name: a.name, species: a.species }));
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Review collection health: ${JSON.stringify(context)}. Provide a Morning Briefing.`,
    }));
    return response.text || "Audit failed.";
  } catch (error) { return "Audit failed."; }
};

export const generateSpeciesCard = async (species: string): Promise<{ text: string, mapImage?: string }> => {
  const ai = getAi();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Generate a comprehensive "Species Intelligence Dossier" for "${species}".
      Include sections for:
      - Global Conservation Status & Threats
      - Dietary Adaptations
      - Behavioral Traits
      - Native Range description
      
      Format as clean Markdown. Do not include images.`,
    }));
    
    return { text: response.text || "Synthesis failed." };
  } catch (error) { 
    // Fallback Mock Data on Error
    console.error("Gemini Error (generateSpeciesCard):", error);
    return { 
        text: `### **${species} (Simulated Dossier)**\n\n*Note: The AI service is currently unavailable. Displaying mock data for demonstration purposes.*\n\n**Global Conservation Status:**\nMost populations of ${species} are currently considered stable, though local declines due to habitat loss are noted.\n\n**Dietary Adaptations:**\nOpportunistic carnivores, they have adapted to hunt a wide variety of prey including small mammals and invertebrates.\n\n**Behavioral Traits:**\nTypically solitary and nocturnal, though crepuscular activity is common in the breeding season.` 
    }; 
  }
};

export const generateExoticSummary = async (species: string): Promise<string> => {
  const ai = getAi();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `3-sentence zoo registry summary for "${species}".`,
      config: { temperature: 0.7 }
    }));
    return response.text?.trim() || "";
  } catch (error) { return ""; }
};
