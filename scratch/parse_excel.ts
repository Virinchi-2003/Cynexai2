import xlsx from 'xlsx';

function parseExcel() {
  const workbook = xlsx.readFile('Student_Data.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  if (data.length > 0) {
    const studentCounts: Record<string, any[]> = {};
    for (const row of data as any[]) {
      const email = row['Gmails'];
      if (!studentCounts[email]) studentCounts[email] = [];
      studentCounts[email].push(row);
    }
    
    console.log(`Total rows: ${data.length}`);
    console.log(`Unique emails: ${Object.keys(studentCounts).length}`);
    
    const multiple = Object.entries(studentCounts).filter(([_, rows]) => rows.length > 1);
    if (multiple.length > 0) {
      console.log(`Students with multiple rows: ${multiple.length}`);
      console.log("Example:", multiple[0][0]);
      console.log(multiple[0][1].map(r => ({ module: r['Modules'], classesCompleted: r['Classes completed'] })));
    } else {
      console.log("No students have multiple rows. The 'Modules' column must be their current module.");
    }
  } else {
    console.log("Empty sheet.");
  }
}

parseExcel();
