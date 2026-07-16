import * as XLSX from 'xlsx';

const workbook = XLSX.readFile('Modules Data.xlsx');
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log('Sheet:', sheetName);
  if (data.length > 0) {
    console.log('First row keys:', Object.keys(data[0] as any));
    console.log('First row data:', data[0]);
  }
}
