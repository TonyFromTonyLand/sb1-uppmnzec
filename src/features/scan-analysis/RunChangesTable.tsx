import React, { useState } from 'react';
import { PageComparisonResult } from '../../types';
import { Search, Filter, ArrowUpDown, Plus, Minus, Edit3, ExternalLink, Eye } from 'lucide-react';

interface RunChangesTableProps {
  pageChanges: PageComparisonResult[];
  onPageSelect: (page: PageComparisonResult) => void;
}

type SortOption = 'url' | 'changeType' | 'severity' | 'changesCount';
type SortDirection = 'asc' | 'desc';

export function RunChangesTable({ pageChanges, onPageSelect }: RunChangesTableProps) {
  const [changeFilter, setChangeFilter] = useState<'all' | 'added' | 'removed' | 'modified'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const filteredChanges = pageChanges.filter(change => {
    const matchesChangeType = changeFilter === 'all' || change.changeType === changeFilter;
    const matchesSeverity = severityFilter === 'all' || change.severity === severityFilter;
    const matchesSearch = searchQuery === '' || 
      change.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChangeType && matchesSeverity && matchesSearch && change.changeType !== 'unchanged';
  });

  // Sort filtered changes
  const sortedChanges = [...filteredChanges].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'url':
        comparison = a.url.localeCompare(b.url);
        break;
      case 'changeType':
        const typeOrder = { 'added': 1, 'removed': 2, 'modified': 3 };
        comparison = typeOrder[a.changeType] - typeOrder[b.changeType];
        break;
      case 'severity':
        const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
      case 'changesCount':
        comparison = a.changes.length - b.changes.length;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('desc');
    }
  };

  const togglePageExpansion = (url: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(url)) {
      newExpanded.delete(url);
    } else {
      newExpanded.add(url);
    }
    setExpandedPages(newExpanded);
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      default:
        return <Edit3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'removed':
        return 'bg-red-50 border-red-200';
      case 'modified':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-700 bg-red-100';
      case 'medium':
        return 'text-amber-700 bg-amber-100';
      case 'low':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getFieldImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={changeFilter}
              onChange={(e) => setChangeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Changes</option>
              <option value="added">Added</option>
              <option value="removed">Removed</option>
              <option value="modified">Modified</option>
            </select>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Severity</option>
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
          </select>

          <div className="text-sm text-gray-500">
            {sortedChanges.length} of {pageChanges.filter(c => c.changeType !== 'unchanged').length} changes
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="flex space-x-2">
            {[
              { key: 'severity', label: 'Severity' },
              { key: 'changeType', label: 'Type' },
              { key: 'changesCount', label: 'Changes' },
              { key: 'url', label: 'URL' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key as SortOption)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  sortBy === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
                {sortBy === key && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Changes List */}
      <div className="bg-white rounded-xl border border-gray-200">
        {sortedChanges.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No changes found</h3>
            <p className="text-gray-500">
              {searchQuery || changeFilter !== 'all' || severityFilter !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'No changes detected between these two scan runs'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedChanges.map((change) => (
              <div key={change.url} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg border ${getChangeColor(change.changeType)}`}>
                      {getChangeIcon(change.changeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{change.url}</h3>
                        <a
                          href={change.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getChangeColor(change.changeType)}`}>
                          {change.changeType}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(change.severity)}`}>
                          {change.severity} impact
                        </div>
                        <div className="text-sm text-gray-500">
                          {change.changes.length} field{change.changes.length !== 1 ? 's' : ''} changed
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onPageSelect(change)}
                      className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    <button
                      onClick={() => togglePageExpansion(change.url)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {expandedPages.has(change.url) ? 'Hide Changes' : 'Show Changes'}
                    </button>
                  </div>
                </div>

                {expandedPages.has(change.url) && (
                  <div className="ml-16 space-y-3">
                    {change.changes.map((fieldChange, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {fieldChange.field.charAt(0).toUpperCase() + fieldChange.field.slice(1)}
                          </div>
                          <div className={`text-xs font-medium ${getFieldImpactColor(fieldChange.impact)}`}>
                            {fieldChange.impact} impact
                          </div>
                        </div>
                        
                        {fieldChange.type === 'modified' && (
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-red-600">Before:</span>
                              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 font-mono text-xs">
                                {fieldChange.oldValue || '(empty)'}
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-green-600">After:</span>
                              <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-green-800 font-mono text-xs">
                                {fieldChange.newValue || '(empty)'}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {fieldChange.type === 'added' && (
                          <div className="text-sm">
                            <span className="font-medium text-green-600">Added:</span>
                            <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-green-800 font-mono text-xs">
                              {fieldChange.newValue}
                            </div>
                          </div>
                        )}
                        
                        {fieldChange.type === 'removed' && (
                          <div className="text-sm">
                            <span className="font-medium text-red-600">Removed:</span>
                            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 font-mono text-xs">
                              {fieldChange.oldValue}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}