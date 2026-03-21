import fs from 'fs';
import path from 'path';

const directories = ['src/pages', 'src/components'];

const replacements = [
    { regex: /(?<!dark:)\bbg-white\b/g, replacement: 'bg-white dark:bg-nature-950' },
    { regex: /(?<!dark:)\btext-nature-900\b/g, replacement: 'text-nature-900 dark:text-white' },
    { regex: /(?<!dark:)\bborder-nature-200\b/g, replacement: 'border-nature-200 dark:border-nature-800' },
    { regex: /(?<!dark:)\bbg-nature-50\b/g, replacement: 'bg-nature-50 dark:bg-nature-900' },
    { regex: /(?<!dark:)\btext-nature-800\b/g, replacement: 'text-nature-800 dark:text-nature-100' },
    { regex: /(?<!dark:)\btext-nature-700\b/g, replacement: 'text-nature-700 dark:text-nature-200' },
    { regex: /(?<!dark:)\bborder-nature-100\b/g, replacement: 'border-nature-100 dark:border-nature-700/50' },
    { regex: /(?<!dark:)\bbg-nature-100\b/g, replacement: 'bg-nature-100 dark:bg-nature-800' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const { regex, replacement } of replacements) {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

for (const dir of directories) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
        processDirectory(fullPath);
    }
}

console.log('Dark mode classes applied successfully.');
