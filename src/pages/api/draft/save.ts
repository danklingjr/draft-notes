import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const DRAFT_FILE = path.join(process.cwd(), 'data', 'draft-state.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Ensure data directory exists
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });

    // Write the draft state to file
    await fs.writeFile(DRAFT_FILE, JSON.stringify(req.body, null, 2));

    res.status(200).json({ message: 'Draft state saved successfully' });
  } catch (error) {
    console.error('Error saving draft state:', error);
    res.status(500).json({ message: 'Failed to save draft state' });
  }
} 