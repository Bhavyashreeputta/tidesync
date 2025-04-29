import React, { ChangeEvent, useState, useCallback } from 'react';
import Head from 'next/head';
import DataTable from '../components/DataTable';
import { parseCsv } from '../lib/parseCsv';
import { ParsedCsv, PatientRow } from '../types';

/* Main uploader page */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EXPECTED_HEADERS = [
  'EHR ID',
  'Patient Name',
  'Email',
  'Phone',
  'Referring Provider'
];

export default function Home() {
  const [data, setData] = useState<ParsedCsv | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [colWarnings, setColWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    setColWarnings([]);
    setSyncError(null);
    setSyncSuccess(false);
    setData(null);

    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Please select a .CSV file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File too large (max 5 MB).');
      return;
    }
    try {
      setLoading(true);
      const parsed = await parseCsv(file);
      const extra = parsed.headers.filter(
        h => !EXPECTED_HEADERS.includes(h)
      );
      const missing = EXPECTED_HEADERS.filter(
        h => !parsed.headers.includes(h)
      );
      const warnings: string[] = [];
      if (extra.length)
        warnings.push(`Unexpected columns: ${extra.join(', ')}`);
      if (missing.length)
        warnings.push(`Missing columns: ${missing.join(', ')}`);
      setColWarnings(warnings);

      setData(parsed);
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCellUpdate = useCallback((rowIndex: number, key: string, value: string) => {
    if (!data) return;
    const updatedRows = data.rows.map((r, idx) =>
      idx === rowIndex ? { ...r, [key]: value } : r
    );
    setData({ headers: data.headers, rows: updatedRows });
  }, [data]);

  const handleSync = async () => {
    if (!data) return;
    setSyncError(null);
    setSyncSuccess(false);
    setIsSyncing(true);

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: data.rows as PatientRow[] }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Sync failed');
      }
      setSyncSuccess(true);
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container">
      <Head><title>Patient CSV Uploader</title></Head>
      <h1 className="page-title">Patient CSV Uploader</h1>
      <p className="page-description">Select a CSV file to begin.</p>

      <div className="file-input-wrapper">
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </div>

      {fileError && <div className="banner-error">{fileError}</div>}
      {colWarnings.length > 0 && (
        <div className="banner-warning">
          {colWarnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {loading && <div className="spinner" role="status" aria-label="Loading"></div>}

      {data && (
        <>
          <small className="note">Select a cell to edit</small>
          <DataTable headers={data.headers} rows={data.rows} onChange={handleCellUpdate} />
          <div className="button-wrapper">
            <button
              onClick={handleSync}
              disabled={isSyncing || data.rows.length === 0}
            >
              {isSyncing ? 'Syncing…' : 'Sync to CRM'}
            </button>
          </div>
          {syncError && <p className="error">{syncError}</p>}
          {syncSuccess && <div className="banner-success">Data synced!</div>}
        </>
      )}
    </div>
  );
}