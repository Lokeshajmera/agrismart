import axios from 'axios';

// Simple LRU cache and Queue to avoid hammering the free API
const translationCache = {};
const pendingRequests = {};
const requestQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT = 10; // Boosted concurrency since it's local

const processQueue = () => {
    if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT) return;
    activeRequests++;
    const nextTask = requestQueue.shift();
    nextTask().finally(() => {
        activeRequests--;
        setTimeout(processQueue, 10); // Minimal delay instead of 300ms since we run it locally!
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
                // Pointing to your fast local HuggingFace Python API!
                const response = await axios.post(`http://127.0.0.1:5001/translate`, {
                    text: text,
                    target_lang: targetLang
                });

                if (response.data && response.data.translatedText) {
                    const translated = response.data.translatedText;
                    translationCache[cacheKey] = translated;
                    resolve(translated);
                    return;
                }
                resolve(text);
            } catch (error) {
                console.error('Local Translation Server error. Ensure python translation_server.py is running on port 5001:', error);
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
