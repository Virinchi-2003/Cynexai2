import xlsx from 'xlsx';

const workbook = xlsx.readFile('C:\\Users\\kk\\.gemini\\antigravity\\scratch\\cynexai-website\\Modules Data.xlsx');
console.log("Sheets:", workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\nSheet: ${sheetName}`);
    if (data.length > 0) {
        console.log("Headers:", data[0]);
        if (data.length > 1) {
            console.log("First Row:", data[1]);
        }
    }
}
