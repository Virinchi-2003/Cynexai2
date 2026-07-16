import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, 'Student_Data.xlsx');
const wb = XLSX.readFile(filePath);

console.log("=== SHEET NAMES ===");
console.log(wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws);
  
  console.log(`\n=== SHEET: ${sheetName} (${data.length} rows) ===`);
  if (data.length > 0) {
    console.log("COLUMNS:", Object.keys(data[0]));
    console.log("\nFIRST 3 ROWS:");
    data.slice(0, 3).forEach((row, i) => {
      console.log(`  Row ${i + 1}:`, JSON.stringify(row));
    });
  }
}
