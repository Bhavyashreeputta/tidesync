import React from 'react';
import { DataTableProps } from '../types';

/** Editable table for CSV data */
const DataTable: React.FC<DataTableProps> = ({ headers, rows, onChange }) => (
    <div className="table-wrapper">
        <table className="datatable-table">
            <thead>
                <tr>
                    {headers.map(header => (
                        <th key={header} className="datatable-header">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {headers.map(colKey => (
                            <td key={colKey} className="datatable-cell">
                                <input
                                    type="text"
                                    className="datatable-input"
                                    value={row[colKey]}
                                    onChange={e => onChange(rowIndex, colKey, e.target.value)}
                                    aria-label={`Row ${rowIndex + 1} ${colKey}`}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default DataTable;
