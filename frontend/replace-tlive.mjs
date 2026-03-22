import fs from 'fs';
const files = ['src/pages/FarmMap.jsx', 'src/pages/AICropIntelligence.jsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ useLiveTranslation \} from '\.\.\/hooks\/useLiveTranslation';/g, "import { useTranslation } from 'react-i18next';");
  content = content.replace(/const \{ tLive \} = useLiveTranslation\(\);/g, "const { t } = useTranslation();");
  content = content.replace(/tLive\(/g, "t(");
  fs.writeFileSync(file, content);
});
console.log('Replaced hooks and calls.');
