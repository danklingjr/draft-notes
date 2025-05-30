import React, { useEffect } from 'react';
import DraftBoard from './components/DraftBoard';
import DraftSidebar from './components/DraftSidebar';
import { DraftProvider } from './context/DraftContext';

function App() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <DraftProvider>
      <div className="min-h-screen bg-[#0A1929] p-4">
        {/* Main Content Container */}
        <div className="container mx-auto h-[calc(100vh-32px)]">
          <div className="flex bg-white rounded-lg shadow-lg h-full">
            {/* Draft Board */}
            <div className="flex-1">
              <DraftBoard />
            </div>

            {/* Roster Sidebar */}
            <div className="w-80 h-full">
              <DraftSidebar />
            </div>
          </div>
        </div>
      </div>
    </DraftProvider>
  );
}

export default App; 