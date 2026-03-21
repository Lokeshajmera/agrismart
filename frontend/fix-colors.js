const fs = require('fs');

const files = [
  'c:/Users/Lokesh/OneDrive/Desktop/Proper/New/Hackathon/frontend/src/context/AlertsContext.jsx',
  'c:/Users/Lokesh/OneDrive/Desktop/Proper/New/Hackathon/frontend/src/pages/Dashboard.jsx',
];

const replacements = {
    'bg-red-50': 'bg-red-50 dark:bg-red-900/30',
    'border-red-100': 'border-red-100 dark:border-red-800/50',
    'border-red-200': 'border-red-200 dark:border-red-800/50',
    'text-red-500': 'text-red-500 dark:text-red-400',
    'text-red-600': 'text-red-600 dark:text-red-400',

    'bg-orange-50': 'bg-orange-50 dark:bg-orange-900/30',
    'border-orange-200': 'border-orange-200 dark:border-orange-800/50',
    'text-orange-500': 'text-orange-500 dark:text-orange-400',
    'text-orange-600': 'text-orange-600 dark:text-orange-400',

    'bg-blue-50': 'bg-blue-50 dark:bg-blue-900/30',
    'border-blue-100': 'border-blue-100 dark:border-blue-800/50',
    'border-blue-200': 'border-blue-200 dark:border-blue-800/50',
    'bg-blue-100': 'bg-blue-100 dark:bg-blue-800/50',
    'text-blue-500': 'text-blue-500 dark:text-blue-400',
    'text-blue-600': 'text-blue-600 dark:text-blue-400',

    'bg-green-50': 'bg-green-50 dark:bg-green-900/30',
    'border-green-200': 'border-green-200 dark:border-green-800/50',
    'text-green-500': 'text-green-500 dark:text-green-400',
    'text-green-600': 'text-green-600 dark:text-green-400',

    'bg-purple-50': 'bg-purple-50 dark:bg-purple-900/30',
    'border-purple-100': 'border-purple-100 dark:border-purple-800/50',
    'border-purple-200': 'border-purple-200 dark:border-purple-800/50',
    'bg-purple-100': 'bg-purple-100 dark:bg-purple-800/50',
    'text-purple-500': 'text-purple-500 dark:text-purple-400',
    'text-purple-600': 'text-purple-600 dark:text-purple-400',

    'bg-yellow-50': 'bg-yellow-50 dark:bg-yellow-900/30',
    'border-yellow-200': 'border-yellow-200 dark:border-yellow-800/50',
    'text-yellow-500': 'text-yellow-500 dark:text-yellow-400',
    'text-yellow-600': 'text-yellow-600 dark:text-yellow-400',
    
    'bg-cyan-50': 'bg-cyan-50 dark:bg-cyan-900/30',
    'bg-cyan-100': 'bg-cyan-100 dark:bg-cyan-800/50',
    'border-cyan-100': 'border-cyan-100 dark:border-cyan-800/50',
    
    'bg-earth-50': 'bg-earth-50 dark:bg-earth-900/30',
};

// Also let's fix the hardcoded #e1efe6 in Circular Progress if needed, but not strictly required.
// We'll focus strictly on tailwind classes.

for (const filepath of files) {
  if (!fs.existsSync(filepath)) continue;
  let fileData = fs.readFileSync(filepath, 'utf8');
  
  for (const [key, val] of Object.entries(replacements)) {
      // Regex matches word boundary so we don't accidentally replace text-red-500 in text-red-5000 
      // Negative lookahead to ensure we don't replace if it already has dark: variant right after
      const regex = new RegExp(`\\b${key}\\b(?!\\s*dark:)`, 'g');
      
      // Wait, if it's "bg-red-50" string, replacing it with "bg-red-50 dark:bg-red-900/30" is correct.
      // What if it already has "bg-red-50 dark:bg-red-900/30"? The negative lookahead `(?!\\s*dark:)` prevents double-replacing!
      fileData = fileData.replace(regex, val);
  }

  // A specific fix for the Recommendations icon border which might be hardcoded as `border-nature-100` inside map without dark variant
  fileData = fileData.replace(/border-nature-100(?!\\s*dark:)/g, 'border-nature-100 dark:border-nature-700');
  
  fs.writeFileSync(filepath, fileData);
}

console.log('Colors fixed successfully!');
