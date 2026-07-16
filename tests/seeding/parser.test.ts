import { describe, it, expect, vi } from 'vitest';
import { parseModules } from '../../scripts/seeding/parser';
import * as xlsx from 'xlsx';

vi.mock('xlsx', () => {
  return {
    readFile: vi.fn(),
    utils: {
      sheet_to_json: vi.fn()
    }
  };
});

describe('parseModules', () => {
  it('parses an excel file and returns modules with their classes', () => {
    const mockSheet1 = {};
    const mockSheet2 = {};
    
    // @ts-ignore
    vi.mocked(xlsx.readFile).mockReturnValue({
      SheetNames: ['Module 1', 'Module 2'],
      Sheets: {
        'Module 1': mockSheet1,
        'Module 2': mockSheet2,
      },
    });

    // @ts-ignore
    vi.mocked(xlsx.utils.sheet_to_json).mockImplementation((sheet: any) => {
      if (sheet === mockSheet1) {
        return [
          { 'Class Title': 'Intro to AI', 'Type': 'Video', 'Status': 'Published' },
        ];
      }
      if (sheet === mockSheet2) {
        return [
          { 'Class Title': 'Advanced ML', 'Type': 'Document', 'Status': 'Draft' },
        ];
      }
      return [];
    });

    const result = parseModules('dummy.xlsx');
    
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Module 1');
    expect(result[0].classes.length).toBe(1);
    expect(result[0].classes[0].title).toBe('Intro to AI');
    expect(result[0].classes[0].type).toBe('Video');
    expect(result[0].classes[0].status).toBe('Published');

    expect(result[1].title).toBe('Module 2');
    expect(result[1].classes.length).toBe(1);
    expect(result[1].classes[0].title).toBe('Advanced ML');
  });
});
