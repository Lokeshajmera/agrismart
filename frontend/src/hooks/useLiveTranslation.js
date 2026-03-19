import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/translationService';

export const useLiveTranslation = () => {
    const { i18n } = useTranslation();
    const [translations, setTranslations] = useState({});

    // This hook takes raw English text, checks if it's already translated, and if not, calls the API.
    const tLive = (text) => {
        const lang = i18n.language.split('-')[0] || 'en';
        
        // If language is English, just return the text
        if (lang === 'en') return text;

        // If we already translated it, return translation
        const cacheKey = `${text}_${lang}`;
        if (translations[cacheKey]) {
            return translations[cacheKey];
        }

        // Fast-path: immediately set it to 'translating...' or original text to prevent flashing empty
        // We set it to the original text initially while we kick off the translation
        
        // Kick off the API translation asynchronously if we aren't already tracking it
        translateText(text, lang).then(translated => {
            setTranslations(prev => {
                // Only update if it actually changed to prevent infinite re-renders
                if (prev[cacheKey] !== translated) {
                    return { ...prev, [cacheKey]: translated };
                }
                return prev;
            });
        });

        // Return original text temporarily until translation arrives
        return text;
    };

    return { tLive, i18n };
};
