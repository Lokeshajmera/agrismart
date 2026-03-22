import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/translationService';

// Helper to convert English phrases to i18n keys as fallback
const textToKey = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
};

export const useLiveTranslation = () => {
    const { t, i18n } = useTranslation();
    const [dynamicCache, setDynamicCache] = useState(() => JSON.parse(localStorage.getItem('agri_translations') || '{}'));
    const pendingRef = useRef(new Set());

    const tLive = (text) => {
        if (!text) return text;
        const lang = i18n.language.split('-')[0] || 'en';
        
        // Fast path for English
        if (lang === 'en') return text;

        // 1. Try exact English string match in i18n.js
        if (i18n.exists(text)) return t(text);
        
        // 2. Try the slugified version in i18n.js
        const key = textToKey(text);
        if (i18n.exists(key)) return t(key);

        // 3. Try the LocalStorage Cache (Instant 0ms)
        const cacheKey = `${text}_${lang}`;
        if (dynamicCache[cacheKey]) return dynamicCache[cacheKey];

        // 4. Background Fetch Translation via local Python AI logic if not already fetching
        if (!pendingRef.current.has(cacheKey)) {
            pendingRef.current.add(cacheKey);
            
            translateText(text, lang).then(translatedStr => {
                if (translatedStr !== text) {
                    setDynamicCache(prev => {
                        const next = { ...prev, [cacheKey]: translatedStr };
                        localStorage.setItem('agri_translations', JSON.stringify(next));
                        return next;
                    });
                }
            }).catch(err => {
                console.error('Translation fallback failed:', err);
                pendingRef.current.delete(cacheKey); // allow retrying if it failed
            });
        }

        // Fallback instantly without hanging while background translation populates
        return text;
    };

    return { tLive, i18n };
};
