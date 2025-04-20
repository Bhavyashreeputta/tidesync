// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import type { PatientRow } from '../../types';

type SyncRequest = { rows: PatientRow[] };
type SyncResponse = { success: boolean; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  const { rows } = req.body as SyncRequest;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ success: false, error: 'No rows to sync' });
  }

  try {
    const CRM_URL = process.env.CRM_API_URL!;
    const CRM_KEY = process.env.CRM_API_KEY!;

    const crmRes = await fetch(`${CRM_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CRM_KEY}`,
      },
      body: JSON.stringify({ records: rows }),
    });

    if (!crmRes.ok) {
      const text = await crmRes.text();
      throw new Error(`CRM responded ${crmRes.status}: ${text}`);
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    console.error('Sync error:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
