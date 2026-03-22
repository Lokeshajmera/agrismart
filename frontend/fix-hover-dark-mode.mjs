import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add dark:hover:bg-nature-800 where hover:bg-nature-50 is used
  content = content.replace(/(?<!dark:)hover:bg-nature-50(?!\s+dark:hover:)/g, 'hover:bg-nature-50 dark:hover:bg-nature-800');
  // Add dark:hover:bg-nature-700 where hover:bg-nature-100 is used
  content = content.replace(/(?<!dark:)hover:bg-nature-100(?!\s+dark:hover:)/g, 'hover:bg-nature-100 dark:hover:bg-nature-700');
  
  // Also fix green buttons
  content = content.replace(/(?<!dark:)hover:bg-green-100(?!\s+dark:hover:)/g, 'hover:bg-green-100 dark:hover:bg-green-900/40');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walk(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return count;
  for (const f of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      count += walk(fullPath);
    } else if (f.endsWith('.jsx')) {
      if (processFile(fullPath)) count++;
    }
  }
  return count;
}

const countPages = walk(path.join(__dirname, 'src', 'pages'));
const countComps = walk(path.join(__dirname, 'src', 'components'));
console.log(`Fixed hover issues in ${countPages + countComps} files.`);
