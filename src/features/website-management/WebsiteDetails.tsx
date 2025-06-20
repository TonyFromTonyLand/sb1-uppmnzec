import React, { useState } from 'react';
import { Website } from '../../types';
import { ArrowLeft, History, BarChart3, Eye } from 'lucide-react';
import { ScanHistory } from '../scan-analysis/ScanHistory';
import { RunComparison } from '../scan-analysis/RunComparison';

interface WebsiteDetailsProps {
  website: Website;
  onBack: () => void;
}

type DetailView = 'history' | 'analysis';

export function WebsiteDetails({ website, onBack }: WebsiteDetailsProps) {
  const [activeView, setActiveView] = useState<DetailView>('history');
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  const handleRunSelection = (runIds: string[]) => {
    setSelectedRuns(runIds);
  };

  const handleAnalyzeComparison = () => {
    if (selectedRuns.length >= 1) {
      setActiveView('analysis');
    }
  };

  const handleBackToHistory = () => {
    setActiveView('history');
    // Keep selections when going back
  };

  const canShowAnalysis = selectedRuns.length >= 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{website.name}</h1>
          <p className="text-gray-500">{website.url}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveView('history')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Scan History</span>
            </div>
          </button>
          <button
            onClick={() => canShowAnalysis && setActiveView('analysis')}
            disabled={!canShowAnalysis}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'analysis' && canShowAnalysis
                ? 'border-blue-500 text-blue-600'
                : canShowAnalysis
                ? 'border-transparent text-gray-500 hover:text-gray-700'
                : 'border-transparent text-gray-300 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-2">
              {selectedRuns.length === 1 ? (
                <Eye className="h-4 w-4" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              <span>
                {selectedRuns.length === 1 ? 'Scan Analysis' : selectedRuns.length === 2 ? 'Run Comparison' : 'Analysis'}
              </span>
              {selectedRuns.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {selectedRuns.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'history' && (
        <ScanHistory 
          website={website} 
          selectedRuns={selectedRuns}
          onRunSelection={handleRunSelection}
          onAnalyzeComparison={handleAnalyzeComparison}
        />
      )}
      
      {activeView === 'analysis' && selectedRuns.length > 0 && (
        <RunComparison 
          website={website}
          runIds={selectedRuns}
          onBack={handleBackToHistory}
        />
      )}
    </div>
  );
}