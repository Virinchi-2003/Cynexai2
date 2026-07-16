const fs = require('fs');
const path = require('path');

function search(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      search(fullPath, query);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(query)) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (line.includes(query)) {
                console.log(`  ${i+1}: ${line.trim()}`);
            }
        });
      }
    }
  }
}

console.log("Searching for Digital Marketer:");
search('src', 'Digital Marketer');
console.log("\nSearching for DM (word boundary):");
// using regex for word boundary for DM
function searchDM(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDM(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.json'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/\bDM\b/.test(content)) {
        console.log(`Found DM in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (/\bDM\b/.test(line)) {
                console.log(`  ${i+1}: ${line.trim()}`);
            }
        });
      }
    }
  }
}
searchDM('src');
