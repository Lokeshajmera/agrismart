import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/pages', function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    content = content.replace(/import \{ useLiveTranslation \} from '(\.\.\/)+hooks\/useLiveTranslation';/g, "import { useTranslation } from 'react-i18next';");
    content = content.replace(/const \{ tLive \} = useLiveTranslation\(\);/g, "const { t } = useTranslation();");
    content = content.replace(/const \{ tLive: t \} = useLiveTranslation\(\);/g, "const { t } = useTranslation();");
    content = content.replace(/const \{ tLive: t, i18n \} = useLiveTranslation\(\);/g, "const { t, i18n } = useTranslation();");
    content = content.replace(/tLive\(/g, "t(");
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated:', filePath);
    }
  }
});

walkDir('src/components', function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    content = content.replace(/import \{ useLiveTranslation \} from '(\.\.\/)+hooks\/useLiveTranslation';/g, "import { useTranslation } from 'react-i18next';");
    content = content.replace(/const \{ tLive \} = useLiveTranslation\(\);/g, "const { t } = useTranslation();");
    content = content.replace(/const \{ tLive: t \} = useLiveTranslation\(\);/g, "const { t } = useTranslation();");
    content = content.replace(/const \{ tLive: t, i18n \} = useLiveTranslation\(\);/g, "const { t, i18n } = useTranslation();");
    content = content.replace(/tLive\(/g, "t(");
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated:', filePath);
    }
  }
});
console.log('Finished replacing useLiveTranslation hooks.');
