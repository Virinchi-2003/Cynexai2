const fs = require('fs');
try {
  const content = fs.readFileSync('diff.txt', 'utf16le');
  fs.writeFileSync('diff_utf8.txt', content, 'utf8');
  console.log("Converted successfully");
} catch(e) {
  console.error(e);
}
