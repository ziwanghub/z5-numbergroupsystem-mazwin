const STORAGE_KEY = "z5_formula_consent";
const isDev = import.meta.env.DEV;

let consentCache = new Set<string>();

const loadConsent = () => {
    if (!isDev) return;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as string[];
        consentCache = new Set(parsed);
    } catch {
        consentCache = new Set();
    }
};

const saveConsent = () => {
    if (!isDev) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(consentCache)));
};

loadConsent();

export const hasConsent = (key: string) => consentCache.has(key);

export const grantConsent = (key: string) => {
    consentCache.add(key);
    saveConsent();
};
