// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import type { PatientRow } from '../../types';

const BASE = 'https://api.intercom.io'
const TOKEN = process.env.INTERCOM_ACESS_TOKEN!;

const hdrs = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
}

const searchID = async(field: 'external_id', val: string) =>{
  const resp = await fetch(`${BASE}/contacts/search`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify({
      query: {
        field,
        operator: '=',
        value: val
      }
    })
  }).catch(err => {
    console.error('Error searching for ID:', err);
    throw new Error(`Error searching for ID: ${err.message}`);
  });

  if(!resp.ok){
    throw new Error(`Error searching for ${field} ${val}: ${resp.statusText}`);
  }

  const {data} = await resp.json();
  return data[0]?.id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{success: boolean; error?: string}>
){
  if(!TOKEN){
    return res.status(500).json({success: false, error: 'No access token provided'});
  }

  const {rows} = req.body as {rows: PatientRow[]};

  for(let i = 0; i<rows.length; i++){
    const raw = rows[i];
    const line = i+1;

    const row = Object.fromEntries(
      Object.entries(raw).map(([k,v]) => [k, (v as string).trim()])
    ) as PatientRow;

    const payload: {
      external_id?: string;
      name?: string;
      email?: string;
      phone?: string;
      custom_attributes?: {referring_provider?: string};
    } = {}

    if(row['EHR ID']){
      payload.external_id = row['EHR ID'];
    }

    if(row['Patient Name']){
      payload.name = row['Patient Name'];
    }

    if(row['email']){
      payload.email = row['email'];
    }

    if(row['phone']){
      payload.phone = row['phone'];
    }

    if(row['Referring Provider']){
      payload.custom_attributes = {referring_provider: row['Referring Provider']};
    }

    if(!payload.external_id){
      return res.status(400).json({success: false, error: `Row ${line} is missing an EHR ID`});
    }

    const id = payload.external_id ? await searchID('external_id', payload.external_id) : undefined;

    const r = await fetch(
      `${BASE}/contacts/${id ? '/' + id : ''}`,
      {
        method: id? 'PUT' : 'POST',
        headers: hdrs,
        body: JSON.stringify(payload)
      }
    )

    if(!r.ok){
      const err = await r.json();
      return res.status(400).json({success: false, error: `Row ${line} failed: ${err.message}`});
    }
    
    return res.status(200).json({success: true}); 
  }
}