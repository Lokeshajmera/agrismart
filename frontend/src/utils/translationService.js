import axios from 'axios';

// Simple LRU cache and Queue to avoid hammering the free API
const translationCache = {};
const pendingRequests = {};
const requestQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT = 3;

const processQueue = () => {
    if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT) return;
    activeRequests++;
    const nextTask = requestQueue.shift();
    nextTask().finally(() => {
        activeRequests--;
        setTimeout(processQueue, 300); // Small 300ms delay between batch requests
    });
};

export const translateText = async (text, targetLang) => {
    if (!text) return '';
    if (targetLang === 'en') return text; // Default language

    const cacheKey = `${text}_${targetLang}`;
    
    // 1. Check completed cache
    if (translationCache[cacheKey]) {
        return translationCache[cacheKey];
    }
    
    // 2. Check if request is already in-flight
    if (pendingRequests[cacheKey]) {
        return pendingRequests[cacheKey];
    }

    // 3. Queue a new request
    const promise = new Promise((resolve) => {
        const task = async () => {
            try {
                // MyMemory API (Free Tier limit: 500 words/day, strict rate limits)
                const response = await axios.get(`https://api.mymemory.translated.net/get`, {
                    params: {
                        q: text,
                        langpair: `en|${targetLang}`
                    }
                });

                if (response.data && response.data.responseData) {
                    const translated = response.data.responseData.translatedText;
                    
                    // Don't cache API warnings
                    if (translated && !translated.includes("MYMEMORY WARNING")) {
                        translationCache[cacheKey] = translated;
                        resolve(translated);
                        return;
                    }
                }
                resolve(text);
            } catch (error) {
                console.error('Translation error:', error);
                resolve(text); // Fallback to english
            } finally {
                delete pendingRequests[cacheKey];
            }
        };

        requestQueue.push(task);
        processQueue();
    });

    pendingRequests[cacheKey] = promise;
    return promise;
};
