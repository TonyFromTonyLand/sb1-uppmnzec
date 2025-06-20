import React from 'react';
import { RunComparison } from '../../types';
import { TrendingUp, Plus, Minus, Edit3, AlertTriangle } from 'lucide-react';

interface RunComparisonSummaryProps {
  comparison: RunComparison;
}

export function RunComparisonSummary({ comparison }: RunComparisonSummaryProps) {
  const calculatePercentageChange = () => {
    if (comparison.summary.totalPages.base === 0) return 0;
    return Math.round((comparison.summary.totalPages.change / comparison.summary.totalPages.base) * 100);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Run Comparison Summary</h2>
          <p className="text-sm text-gray-500">
            Comparing scan #{comparison.baseRun.id.slice(-6)} vs #{comparison.compareRun.id.slice(-6)}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Base: {comparison.baseRun.startedAt.toLocaleDateString()}</div>
          <div>Compare: {comparison.compareRun.startedAt.toLocaleDateString()}</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Total Pages</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {comparison.summary.totalPages.compare.toLocaleString()}
          </div>
          <div className={`text-sm ${
            comparison.summary.totalPages.change > 0 ? 'text-green-600' : 
            comparison.summary.totalPages.change < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {comparison.summary.totalPages.change > 0 ? '+' : ''}
            {comparison.summary.totalPages.change.toLocaleString()} ({calculatePercentageChange()}%)
          </div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">New Pages</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {comparison.summary.newPages.length.toLocaleString()}
          </div>
        </div>

        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Minus className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-600">Removed</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {comparison.summary.removedPages.length.toLocaleString()}
          </div>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Modified</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {comparison.summary.modifiedPages.length.toLocaleString()}
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Unchanged</span>
          </div>
          <div className="text-2xl font-bold text-gray-600">
            {comparison.summary.unchangedPages.toLocaleString()}
          </div>
        </div>

        <div className="text-center p-4 bg-amber-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-600">Errors</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {comparison.summary.errorPages.compare.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}