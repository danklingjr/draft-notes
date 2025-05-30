import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const DRAFT_FILE = path.join(process.cwd(), 'data', 'draft-state.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if file exists
    try {
      await fs.access(DRAFT_FILE);
    } catch {
      // Return empty state if file doesn't exist
      return res.status(200).json({
        myDraftedPlayers: [],
        otherDraftedPlayers: [],
        timestamp: new Date().toISOString()
      });
    }

    // Read and parse the draft state
    const data = await fs.readFile(DRAFT_FILE, 'utf-8');
    const state = JSON.parse(data);

    res.status(200).json(state);
  } catch (error) {
    console.error('Error loading draft state:', error);
    res.status(500).json({ message: 'Failed to load draft state' });
  }
} 