const fs = require('fs');
const path = require('path');

function getAllFiles(dir, extArray, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, extArray, fileList);
    } else {
      if (extArray.some(ext => fullPath.endsWith(ext))) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const allFiles = getAllFiles(path.join(__dirname, 'src'), ['.ts', '.tsx']);
const contents = allFiles.map(f => fs.readFileSync(f, 'utf8'));

const orphanCandidates = [];
for (const file of allFiles) {
  // Check if file is imported anywhere
  const baseName = path.basename(file, path.extname(file));
  if (baseName === 'App' || baseName === 'main' || baseName === 'index' || baseName === 'vite-env.d') continue;
  
  let isImported = false;
  for (const content of contents) {
    // Very simple check: does any file contain the baseName in an import?
    // or just the baseName in general (not perfectly safe but good for a quick check)
    if (content.includes(baseName)) {
      isImported = true;
      break;
    }
  }
  
  if (!isImported) {
    orphanCandidates.push(file);
  }
}

console.log("Potential orphans:");
orphanCandidates.forEach(f => console.log(f));

