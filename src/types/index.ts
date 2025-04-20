export interface ParsedCsv {
    headers: string[];
    rows: Record<string, string>[];
  }
  
  export interface DataTableProps {
    headers: string[];
    rows: Record<string, string>[];
    onChange: (rowIndex: number, key: string, value: string) => void;
  }

  export type PatientRow = { [column: string]: string };