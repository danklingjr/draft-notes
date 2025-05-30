'use client';

import React from 'react';
import DraftBoard from '../components/DraftBoard';
import DraftSidebar from '../components/DraftSidebar';
import { DraftProvider } from '../context/DraftContext';

export default function Home() {
  return (
    <DraftProvider>
      <main className="flex h-screen bg-gray-100">
        <div className="flex-1 overflow-auto">
          <DraftBoard />
        </div>
        <div className="w-80 border-l border-gray-200">
          <DraftSidebar />
        </div>
      </main>
    </DraftProvider>
  );
} 