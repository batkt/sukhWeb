const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        let filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(filePath));
        } else { 
            if (filePath.endsWith('.tsx') && !filePath.includes('DatePickerInput.tsx') && !filePath.includes('StandardDatePicker.tsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;
    
    // Replace imports
    content = content.replace(/import\s+\{\s*DatePickerInput\s*\}\s+from\s+["']@\/components\/ui\/DatePickerInput["'];?/g, 
        'import { StandardDatePicker } from "@/components/ui/StandardDatePicker";');
    content = content.replace(/import\s+DatePickerInput\s+from\s+["']@\/components\/ui\/DatePickerInput["'];?/g, 
        'import { StandardDatePicker } from "@/components/ui/StandardDatePicker";');
    content = content.replace(/import\s+DatePickerInput\s+from\s+["'](\.\.\/)+components\/ui\/DatePickerInput["'];?/g, 
        'import { StandardDatePicker } from "@/components/ui/StandardDatePicker";');
        
    // Replace JSX components
    content = content.replace(/<DatePickerInput/g, '<StandardDatePicker');
    content = content.replace(/<\/DatePickerInput>/g, '</StandardDatePicker>');

    // Standardize 'type="range"' to 'isRange={true}' only if it's inside StandardDatePicker
    // Note: Due to multi-line tags, this approach replaces type=\"range\" string where last seen tag is <StandardDatePicker
    content = content.replace(/type=["']range["']/g, function(match, offset, fullText) {
       const lastTagOpen = fullText.lastIndexOf('<StandardDatePicker', offset);
       const lastTagClose = fullText.lastIndexOf('>', offset);
       if (lastTagOpen > -1 && lastTagOpen > lastTagClose) {
           return 'isRange={true}';
       }
       return match;
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content);
        changedFiles++;
        console.log('Updated:', file);
    }
});
console.log(`Total files updated: ${changedFiles}`);
