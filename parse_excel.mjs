import * as XLSX from 'xlsx';
import fs from 'fs';

function readExcel(filename) {
  if (!fs.existsSync(filename)) {
    console.log(`File ${filename} not found.`);
    return;
  }
  const buf = fs.readFileSync(filename);
  const workbook = XLSX.read(buf);
  console.log(`\n=== File: ${filename} ===`);
  console.log('Sheets:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
      console.log('First 2 rows:', JSON.stringify(data.slice(0, 2), null, 2));
    } else {
      console.log('Empty sheet');
    }
  });
}

readExcel('Student_Data.xlsx');
readExcel('Modules Data.xlsx');
