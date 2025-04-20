import Papa from 'papaparse';
import { ParsedCsv } from '../types';

/*Parse a CSV File object into headers + row objects.
Rejects if parsing fails or CSV is too small.*/

export function parseCsv(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      complete: (results) => {
        const allRows = results.data;
        const filtered = allRows.filter(row => row.length > 1);
        if (filtered.length < 2) {
          return reject(new Error('CSV must have a header row and at least one data row'));
        }

        const [rawHeaders, ...rawRows] = filtered;

        const headers = rawHeaders.map(h => h.trim());

        const rows = rawRows.map(rowArr => {
          const record: Record<string, string> = {};
          headers.forEach((key, idx) => {
            record[key] = (rowArr[idx] || '').trim();
          });
          return record;
        });

        resolve({ headers, rows });
      },
      error: err => {
        reject(new Error(`CSV parse error: ${err.message}`));
      }
    });
  });
}
