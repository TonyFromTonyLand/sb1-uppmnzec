import React from 'react';
import { Website, ScanRun } from '../../types';
import { useScanRuns } from '../../hooks/useScanRuns';

interface WebsiteScanRunsProps {
  website: Website;
  onRunsLoaded: (websiteId: string, runs: ScanRun[]) => void;
}

export function WebsiteScanRuns({ website, onRunsLoaded }: WebsiteScanRunsProps) {
  const { runs } = useScanRuns(website.id);

  React.useEffect(() => {
    onRunsLoaded(website.id, runs);
  }, [website.id, runs, onRunsLoaded]);

  return null; // This component doesn't render anything
}