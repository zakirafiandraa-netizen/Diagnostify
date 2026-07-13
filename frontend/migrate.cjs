const fs = require('fs');
const path = require('path');

const mapping = {
  "AlertCircle": "WarningCircle",
  "AlertTriangle": "Warning",
  "ArrowLeft": "ArrowLeft",
  "BookOpen": "BookOpen",
  "Check": "Check",
  "CheckCircle": "CheckCircle",
  "CheckCircle2": "CheckCircle",
  "CheckIcon": "Check",
  "ChevronDownIcon": "CaretDown",
  "ChevronLeft": "CaretLeft",
  "ChevronLeftIcon": "CaretLeft",
  "ChevronRight": "CaretRight",
  "ChevronRightIcon": "CaretRight",
  "ChevronUpIcon": "CaretUp",
  "CircleIcon": "Circle",
  "Clock": "Clock",
  "Copy": "Copy",
  "Crown": "Crown",
  "Eye": "Eye",
  "EyeOff": "EyeClosed",
  "GripVerticalIcon": "DotsSixVertical",
  "HelpCircle": "Question",
  "Home": "House",
  "Loader2": "CircleNotch",
  "MessageCircle": "ChatCircle",
  "MessageSquare": "Chat",
  "Minus": "Minus",
  "MinusIcon": "Minus",
  "MoreHorizontalIcon": "DotsThree",
  "PanelLeftIcon": "SidebarSimple",
  "Plus": "Plus",
  "Send": "PaperPlaneRight",
  "Shield": "Shield",
  "Star": "Star",
  "Stethoscope": "FirstAid",
  "Target": "Target",
  "Trophy": "Trophy",
  "User": "User",
  "UserX": "UserMinus",
  "Users": "Users",
  "Wifi": "WifiHigh",
  "WifiOff": "WifiSlash",
  "X": "X",
  "XCircle": "XCircle",
  "XIcon": "X",
  "Zap": "Lightning"
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match `import { ... } from "lucide-react";` (multi-line or single-line)
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  
  if (importRegex.test(content)) {
    let newContent = content.replace(importRegex, (match, importsStr) => {
      const items = importsStr.split(',').map(s => s.trim()).filter(s => s);
      const newItems = items.map(item => {
        let name = item;
        let alias = item;
        if (item.includes(' as ')) {
          [name, alias] = item.split(' as ').map(s => s.trim());
        }
        const phosphorName = mapping[name];
        if (!phosphorName) {
           console.log(`Missing mapping for ${name} in ${file}`);
           return item; // fallback to same
        }
        if (phosphorName === alias) {
           return phosphorName;
        }
        return `${phosphorName} as ${alias}`;
      });
      return `import { ${newItems.join(', ')} } from "@phosphor-icons/react";`;
    });
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
