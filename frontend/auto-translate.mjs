import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'src', 'pages');

const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Skip if already heavily using useLiveTranslation
    if (content.includes('useLiveTranslation')) return false;

    // Insert the import after the first import
    content = content.replace(/(import.*?;?\n)/, "$1import { useLiveTranslation } from '../hooks/useLiveTranslation';\n");

    // Insert the hook inside the component
    // Assuming default export function ComponentName() {
    content = content.replace(/export default function ([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/, "export default function $1() {\n  const { tLive } = useLiveTranslation();\n");
    content = content.replace(/const ([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*\{/, "const $1 = () => {\n  const { tLive } = useLiveTranslation();\n");

    // Find all JSX text nodes (e.g., >Hello World<) and wrap them
    // Only wrap if it contains alphabetical characters, doesn't contain {}, and isn't entirely whitespace
    content = content.replace(/>([^<{}]+)</g, (match, p1) => {
        if (/^[ \t\n\r]*$/.test(p1)) return match; // pure whitespace
        if (!/[a-zA-Z]/.test(p1)) return match; // no letters
        
        // Split by lines to preserve JSX formatting/indentation
        const lines = p1.split('\n');
        const processedLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed && /[a-zA-Z]/.test(trimmed)) {
                // Escape quotes
                const escaped = trimmed.replace(/"/g, '\\"');
                return line.replace(trimmed, `{tLive("${escaped}")}`);
            }
            return line;
        });

        return `>${processedLines.join('\n')}<`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${path.basename(filePath)}`);
        return true;
    }
    return false;
};

let count = 0;
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));
for (const file of files) {
    const fullPath = path.join(pagesDir, file);
    // Exclude pages that already have translation or might break easily with blind regex
    const exclude = ['Dashboard.jsx', 'GovernmentSchemes.jsx', 'IrrigationControl.jsx'];
    if (!exclude.includes(file)) {
        if (processFile(fullPath)) count++;
    }
}

console.log(`Successfully wrapped text nodes in ${count} files.`);
