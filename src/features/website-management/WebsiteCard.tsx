import React, { useState } from 'react';
import { Website } from '../../types';
import { Globe, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, Archive, MoreVertical, Trash2, RotateCcw, Settings, Loader2 } from 'lucide-react';

interface WebsiteCardProps {
  website: Website;
  onViewDetails?: (website: Website) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSettings?: (website: Website) => void;
  daysUntilDeletion?: number | null;
}

export function WebsiteCard({ 
  website, 
  onViewDetails, 
  onArchive, 
  onUnarchive, 
  onDelete, 
  onSettings,
  daysUntilDeletion 
}: WebsiteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isArchived = website.status === 'archived';
  const canViewDetails = !isArchived && onViewDetails;
  const canArchive = !isArchived && onArchive;
  const canUnarchive = isArchived && onUnarchive;
  const canDelete = onDelete;
  const canSettings = onSettings;

  const getStatusIcon = () => {
    switch (website.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (website.status) {
      case 'active':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'paused':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'archived':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  };

  const hasChanges = website.changedPages > 0 || website.newPages > 0 || website.removedPages > 0;

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canArchive) {
      try {
        await onArchive(website.id);
      } catch (err) {
        console.error('Failed to archive website:', err);
      }
    }
    setShowMenu(false);
  };

  const handleUnarchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canUnarchive) {
      try {
        await onUnarchive(website.id);
      } catch (err) {
        console.error('Failed to unarchive website:', err);
      }
    }
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canSettings) onSettings(website);
    setShowMenu(false);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canDelete) {
      setIsDeleting(true);
      try {
        await onDelete(website.id);
      } catch (err) {
        console.error('Failed to delete website:', err);
        setIsDeleting(false);
        // Don't close the modal on error so user can try again
        return;
      }
    }
    setShowDeleteConfirm(false);
    setIsDeleting(false);
  };

  const hasMenuActions = canArchive || canUnarchive || canDelete || canSettings;

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-lg cursor-pointer group relative ${
      isArchived 
        ? 'border-gray-200 opacity-75' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Archive overlay */}
      {isArchived && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <Archive className="h-3 w-3" />
            <span>Archived</span>
          </div>
        </div>
      )}

      {/* Deletion countdown for archived items */}
      {isArchived && daysUntilDeletion !== null && (
        <div className="absolute top-12 right-4 z-10">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            daysUntilDeletion <= 3 
              ? 'bg-red-100 text-red-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {daysUntilDeletion === 0 ? 'Deleting soon' : `${daysUntilDeletion}d left`}
          </div>
        </div>
      )}

      {/* Menu dropdown */}
      {hasMenuActions && (
        <div className="absolute top-4 right-4 z-20">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                {canSettings && (
                  <button
                    onClick={handleSettings}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                )}
                {canArchive && (
                  <button
                    onClick={handleArchive}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archive Website</span>
                  </button>
                )}
                {canUnarchive && (
                  <button
                    onClick={handleUnarchive}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Unarchive Website</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Permanently</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Website</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to permanently delete <strong>{website.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">This will permanently delete:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• All scan history and results</li>
                    <li>• All page snapshots and data</li>
                    <li>• All comparison reports</li>
                    <li>• All background jobs</li>
                    <li>• Website configuration and settings</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className="p-6"
        onClick={() => canViewDetails && !showMenu && !showDeleteConfirm && onViewDetails(website)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg transition-colors ${
              isArchived 
                ? 'bg-gray-100' 
                : 'bg-gray-100 group-hover:bg-blue-100'
            }`}>
              <Globe className={`h-5 w-5 transition-colors ${
                isArchived 
                  ? 'text-gray-400' 
                  : 'text-gray-600 group-hover:text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className={`font-semibold transition-colors ${
                isArchived 
                  ? 'text-gray-600' 
                  : 'text-gray-900 group-hover:text-blue-600'
              }`}>
                {website.name}
              </h3>
              <p className="text-sm text-gray-500">{website.url}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="capitalize">{website.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{website.totalPages.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total Pages</div>
          </div>
          {hasChanges && !isArchived && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(website.changedPages + website.newPages + website.removedPages).toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">Changes</div>
            </div>
          )}
        </div>

        {hasChanges && !isArchived && (
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-blue-600">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                {website.changedPages} modified
              </span>
              {website.newPages > 0 && (
                <span className="text-green-600">+{website.newPages} new</span>
              )}
              {website.removedPages > 0 && (
                <span className="text-red-600">-{website.removedPages} removed</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {isArchived && website.archivedAt 
                ? `Archived: ${formatRelativeTime(website.archivedAt)}`
                : `Last scan: ${formatRelativeTime(website.lastScan)}`
              }
            </span>
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {website.discoveryMethod === 'sitemap' ? 'Sitemap' : 'Crawling'}
          </div>
        </div>
      </div>
    </div>
  );
}