import React, { useState, useEffect } from 'react';
import SuggestionsSidebar from '../components/SuggestionsSidebar';
import { useDraft } from '../context/DraftContext';
import { NFLPlayer, getNFLPlayers } from '../services/nflService';

const TEAMS = 10;

const MockDraft: React.FC = () => {
  const { myDraftedPlayers, otherDraftedPlayers, draftPlayerToMine, draftPlayerToOthers } = useDraft();
  const [availablePlayers, setAvailablePlayers] = useState<NFLPlayer[]>([]);
  const [notes, setNotes] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('https://www.fantasypros.com/draft');
  const [iframeError, setIframeError] = useState(false);
  const [viewMode, setViewMode] = useState<'iframe' | 'buttons'>('iframe');

  useEffect(() => {
    console.log('MockDraft component mounted');
    console.log('Current URL:', window.location.href);
  }, []);

  // Load available players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const allPlayers = await getNFLPlayers();
        const draftedPlayerIds = new Set([
          ...myDraftedPlayers.map(p => p.id),
          ...otherDraftedPlayers.map(p => p.id)
        ]);
        const available = allPlayers.filter(player => !draftedPlayerIds.has(player.id));
        setAvailablePlayers(available);
      } catch (error) {
        console.error('Error loading available players:', error);
      }
    };
    loadPlayers();
  }, [myDraftedPlayers, otherDraftedPlayers]);

  // Calculate round and pick (reuse logic)
  const totalDrafted = myDraftedPlayers.length + otherDraftedPlayers.length;
  const round = Math.floor(totalDrafted / TEAMS) + 1;
  const pick = (totalDrafted % TEAMS) + 1;

  const draftSites = [
    {
      name: 'ESPN Fantasy',
      url: 'https://fantasy.espn.com/football/draft',
      description: 'ESPN Fantasy Football Draft'
    },
    {
      name: 'Yahoo Fantasy',
      url: 'https://football.fantasysports.yahoo.com/f1/draft',
      description: 'Yahoo Fantasy Football Draft'
    },
    {
      name: 'NFL Fantasy',
      url: 'https://fantasy.nfl.com/draft',
      description: 'NFL.com Fantasy Draft'
    },
    {
      name: 'Sleeper',
      url: 'https://sleeper.com/draft',
      description: 'Sleeper App Draft'
    },
    {
      name: 'FantasyPros',
      url: 'https://www.fantasypros.com/draft',
      description: 'FantasyPros Draft Simulator'
    }
  ];

  const openDraftSite = (url: string) => {
    if (viewMode === 'iframe') {
      setCurrentUrl(url);
      setIframeError(false);
    } else {
      window.open(url, '_blank');
    }
  };

  const openCustomUrl = () => {
    if (customUrl.trim()) {
      if (viewMode === 'iframe') {
        setCurrentUrl(customUrl);
        setIframeError(false);
      } else {
        window.open(customUrl, '_blank');
      }
    }
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleIframeLoad = () => {
    setIframeError(false);
  };

  const handleDraft = (player: NFLPlayer, mine: boolean) => {
    if (mine) {
      draftPlayerToMine(player);
    } else {
      draftPlayerToOthers(player);
    }
  };

  const handleDraftOrderChange = (newMyDrafted: NFLPlayer[], newOtherDrafted: NFLPlayer[]) => {
    // Update the draft context with the new order
    // This would need to be implemented in the DraftContext
    console.log('Draft order changed:', { newMyDrafted, newOtherDrafted });
    // For now, we'll just log the changes
    // TODO: Implement proper state update in DraftContext
  };

  console.log('MockDraft rendering, viewMode:', viewMode, 'currentUrl:', currentUrl);
  console.log('Available players:', availablePlayers.length);
  console.log('My drafted players:', myDraftedPlayers.length);
  console.log('Other drafted players:', otherDraftedPlayers.length);

  return (
    <div className="min-h-screen bg-[#0A1929] p-4 flex">
      {/* Suggestions Sidebar (flush left) */}
      <div className="w-96 h-full mr-4">
        <SuggestionsSidebar
          availablePlayers={availablePlayers}
          myRoster={myDraftedPlayers}
          round={round}
          pick={pick}
          onDraft={handleDraft}
          otherDraftedPlayers={otherDraftedPlayers}
          onDraftOrderChange={handleDraftOrderChange}
        />
      </div>
      {/* Main Content Container (centered) */}
      <div className="flex-1">
        <div className="container mx-auto h-[calc(100vh-32px)]">
          <div className="flex bg-white rounded-lg shadow-lg h-full">
            <div className="flex-1 flex flex-col p-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Mock Draft Tools</h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('iframe')}
                    className={`px-4 py-2 rounded ${
                      viewMode === 'iframe' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Embedded View
                  </button>
                  <button
                    onClick={() => setViewMode('buttons')}
                    className={`px-4 py-2 rounded ${
                      viewMode === 'buttons' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Quick Access
                  </button>
                </div>
              </div>
              
              {viewMode === 'iframe' ? (
                <div className="flex-1 flex flex-col">
                  {/* URL Input for iframe mode */}
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      type="text"
                      value={currentUrl}
                      onChange={e => setCurrentUrl(e.target.value)}
                      placeholder="Enter draft site URL to embed..."
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setIframeError(false)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Load
                    </button>
                  </div>

                  {/* Iframe or Error */}
                  {iframeError ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 rounded">
                      <div className="text-red-500 text-xl mb-4">⚠️ Connection Refused</div>
                      <p className="text-gray-600 mb-4">
                        This website doesn't allow embedding in iframes due to security policies.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(currentUrl, '_blank')}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Open in New Tab
                        </button>
                        <button
                          onClick={() => setViewMode('buttons')}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Switch to Quick Access
                        </button>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      src={currentUrl || 'about:blank'}
                      title="Draft Site"
                      className="flex-1 w-full rounded border"
                      style={{ minHeight: 0, border: '1px solid #e5e7eb' }}
                      onError={handleIframeError}
                      onLoad={handleIframeLoad}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Draft Site Quick Access */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Access to Draft Sites</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {draftSites.map((site, index) => (
                        <button
                          key={index}
                          onClick={() => openDraftSite(site.url)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="font-medium text-gray-800">{site.name}</div>
                          <div className="text-sm text-gray-600">{site.description}</div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom URL Input */}
                    <div className="flex items-center gap-2 mb-6">
                      <input
                        type="text"
                        value={customUrl}
                        onChange={e => setCustomUrl(e.target.value)}
                        placeholder="Enter custom draft site URL..."
                        className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={openCustomUrl}
                        disabled={!customUrl.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Open
                      </button>
                    </div>
                  </div>

                  {/* Draft Notes */}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Draft Notes</h2>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Take notes during your mock draft... (e.g., 'QB run started early', 'RBs going fast', 'Good value on WRs in round 4')"
                      className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                      style={{ minHeight: '200px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockDraft; 