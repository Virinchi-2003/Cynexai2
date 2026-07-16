import * as xlsx from 'xlsx';

export interface ClassData {
  title: string;
  type: string;
  status: string;
  [key: string]: any;
}

export interface ModuleData {
  title: string;
  classes: ClassData[];
}

export function parseModules(filePath: string): ModuleData[] {
  const workbook = xlsx.readFile(filePath);
  const modules: ModuleData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // sheet_to_json will return an array of rows (objects)
    const rawData = xlsx.utils.sheet_to_json<any>(sheet);
    
    const classes: ClassData[] = rawData.map(row => ({
      title: row['Class Title'] || '',
      type: row['Type'] || '',
      status: row['Status'] || '',
      ...row
    }));

    modules.push({
      title: sheetName,
      classes
    });
  }

  return modules;
}
