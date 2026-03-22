const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace existing dark mode nature text with dark:text-white
  content = content.replace(/dark:text-nature-[1-9]00/g, 'dark:text-white');

  // 2. Append dark:text-white to text-nature shades
  const shades = [300, 400, 500, 600, 700];
  for (const s of shades) {
    const cls = `text-nature-${s}`;
    // Find cls, but not preceded by "dark:"
    // This adds dark:text-white right after the nature text
    const regex = new RegExp(`(?<!dark:)\\b${cls}\\b`, 'g');
    content = content.replace(regex, `${cls} dark:text-white`);
  }

  // 3. Deduplicate multiple dark:text-white classes that might have been stacked
  content = content.replace(/(dark:text-white\s*){2,}/g, 'dark:text-white ');
  
  // Clean up any stray spaces
  content = content.replace(/ \s+/g, ' ');

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

console.log(`Updated ${countPages + countComps} files.`);
