import React from 'react';
import { CheckCircle, AlertCircle, Clock, Archive } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'error' | 'archived' | 'running' | 'completed' | 'failed' | 'cancelled';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
      case 'cancelled':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'paused':
      case 'cancelled':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'archived':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="capitalize">{status}</span>
    </div>
  );
}