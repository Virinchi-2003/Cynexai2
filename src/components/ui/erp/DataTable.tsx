import React, { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface Column {
  key: string;
  header: string;
  editable?: boolean;
  render?: (row: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: Column[];
  data: any[];
  onSort?: (key: string) => void;
  onFilter?: (key: string, value: string) => void;
  onEdit?: (row: any, key: string, value: string) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onSort,
  onFilter,
  onEdit,
  sortBy,
  sortDir,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: any; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleEditBlur = (row: any, key: string) => {
    if (onEdit) {
      onEdit(row, key, editValue);
    }
    setEditingCell(null);
  };

  const handleCellClick = (row: any, col: Column) => {
    if (col.editable) {
      setEditingCell({ rowId: row.id, colKey: col.key });
      setEditValue(row[col.key]);
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-erp-surface border border-erp-border rounded-xl">
      <table className="w-full text-left text-sm text-erp-text border-collapse">
        <thead className="bg-erp-background border-b border-erp-border">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="p-4 font-bold text-erp-text/70 uppercase tracking-wider text-xs">
                <div 
                  className="flex items-center gap-2 cursor-pointer select-none mb-2"
                  onClick={() => onSort && onSort(col.key)}
                >
                  {col.header}
                  {sortBy === col.key && (
                    sortDir === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                  )}
                </div>
                {onFilter && (
                  <input
                    className="w-full bg-erp-surface border border-erp-border rounded-lg px-2 py-1 text-sm text-erp-text focus:outline-none focus:border-indigo-500"
                    placeholder={`Filter ${col.header}`}
                    onChange={(e) => onFilter(col.key, e.target.value)}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex}
              className="border-b border-erp-border last:border-b-0 hover:bg-erp-background/50 transition-colors"
            >
              {columns.map((col) => {
                const isEditing =
                  editingCell?.rowId === row.id && editingCell?.colKey === col.key;

                return (
                  <td 
                    key={col.key} 
                    className={`p-4 ${col.editable ? 'cursor-pointer hover:bg-erp-background' : ''}`}
                    onClick={() => !isEditing && handleCellClick(row, col)}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        className="w-full bg-erp-surface border border-indigo-500 rounded px-2 py-1 text-sm text-erp-text focus:outline-none"
                        value={editValue}
                        onChange={handleEditChange}
                        onBlur={() => handleEditBlur(row, col.key)}
                      />
                    ) : (
                      col.render ? col.render(row) : row[col.key]
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
