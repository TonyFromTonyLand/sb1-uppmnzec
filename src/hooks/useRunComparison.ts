import { useState, useEffect } from 'react';
import { RunComparison, PageSnapshot, PageComparisonResult, FieldChange, HeaderStructure, SingleRunDetails } from '../types';
import { useScanRuns } from './useScanRuns';

// Mock data generator for page snapshots
const generateMockSnapshots = (runId: string, websiteId: string, count: number): PageSnapshot[] => {
  const snapshots: PageSnapshot[] = [];
  const baseUrls = [
    '/products/electronics',
    '/products/clothing',
    '/products/books',
    '/categories/new-arrivals',
    '/categories/sale',
    '/about-us',
    '/contact',
    '/blog/latest-news',
    '/blog/product-updates',
    '/support/faq',
    '/support/shipping',
    '/account/profile',
    '/account/orders',
    '/checkout',
    '/search',
  ];

  for (let i = 0; i < count; i++) {
    const baseUrl = baseUrls[i % baseUrls.length];
    const url = `https://example.com${baseUrl}${i > baseUrls.length ? `/${i}` : ''}`;
    
    // Generate varied breadcrumbs based on URL structure
    const getBreadcrumbs = (url: string): string[] => {
      if (url.includes('/products/')) {
        return ['Home', 'Products', url.includes('electronics') ? 'Electronics' : url.includes('clothing') ? 'Clothing' : 'Books'];
      } else if (url.includes('/categories/')) {
        return ['Home', 'Categories', url.includes('new-arrivals') ? 'New Arrivals' : 'Sale Items'];
      } else if (url.includes('/blog/')) {
        return ['Home', 'Blog', url.includes('latest-news') ? 'Latest News' : 'Product Updates'];
      } else if (url.includes('/support/')) {
        return ['Home', 'Support', url.includes('faq') ? 'FAQ' : 'Shipping Info'];
      } else if (url.includes('/account/')) {
        return ['Home', 'My Account', url.includes('profile') ? 'Profile' : 'Orders'];
      }
      return ['Home', 'Page'];
    };

    // Generate varied header structures
    const getHeaders = (url: string): HeaderStructure[] => {
      const headers: HeaderStructure[] = [];
      if (url.includes('/products/')) {
        headers.push(
          { level: 1, text: `Product Category - ${url.includes('electronics') ? 'Electronics' : url.includes('clothing') ? 'Clothing' : 'Books'}` },
          { level: 2, text: 'Featured Products' },
          { level: 3, text: 'Product Specifications' }
        );
      } else if (url.includes('/blog/')) {
        headers.push(
          { level: 1, text: url.includes('latest-news') ? 'Latest Company News' : 'Product Updates & Features' },
          { level: 2, text: 'Recent Articles' },
          { level: 3, text: 'Related Topics' }
        );
      } else {
        headers.push(
          { level: 1, text: `Main Heading ${i + 1}` },
          { level: 2, text: `Subheading ${i + 1}` }
        );
      }
      return headers;
    };
    
    snapshots.push({
      id: `snapshot-${runId}-${i}`,
      websiteId,
      scanRunId: runId,
      url,
      timestamp: new Date(),
      title: `Page Title ${i + 1} - Example Store`,
      metaDescription: `Meta description for page ${i + 1} with relevant keywords`,
      canonicalUrl: url,
      breadcrumbs: getBreadcrumbs(url),
      headers: getHeaders(url),
      customData: {
        price: `$${(Math.random() * 100 + 10).toFixed(2)}`,
        stock: Math.random() > 0.8 ? 'out-of-stock' : 'in-stock',
        category: url.includes('/products/') ? 'product' : 'content',
      },
      status: 'active',
      responseCode: 200,
      loadTime: Math.floor(Math.random() * 2000) + 500,
    });
  }

  return snapshots;
};

const compareHeaders = (baseHeaders: HeaderStructure[], compareHeaders: HeaderStructure[]): FieldChange[] => {
  const changes: FieldChange[] = [];
  
  // Create maps for easier comparison
  const baseMap = new Map(baseHeaders.map((h, i) => [`${h.level}-${i}`, h]));
  const compareMap = new Map(compareHeaders.map((h, i) => [`${h.level}-${i}`, h]));
  
  // Check for removed headers
  baseMap.forEach((header, key) => {
    if (!compareMap.has(key)) {
      changes.push({
        field: `header-h${header.level}`,
        type: 'removed',
        oldValue: header.text,
        impact: header.level <= 2 ? 'high' : 'medium',
      });
    }
  });
  
  // Check for added headers
  compareMap.forEach((header, key) => {
    if (!baseMap.has(key)) {
      changes.push({
        field: `header-h${header.level}`,
        type: 'added',
        newValue: header.text,
        impact: header.level <= 2 ? 'high' : 'medium',
      });
    }
  });
  
  // Check for modified headers
  baseMap.forEach((baseHeader, key) => {
    const compareHeader = compareMap.get(key);
    if (compareHeader && baseHeader.text !== compareHeader.text) {
      changes.push({
        field: `header-h${baseHeader.level}`,
        type: 'modified',
        oldValue: baseHeader.text,
        newValue: compareHeader.text,
        impact: baseHeader.level <= 2 ? 'high' : 'medium',
      });
    }
  });
  
  return changes;
};

const compareSnapshots = (base?: PageSnapshot, compare?: PageSnapshot): FieldChange[] => {
  const changes: FieldChange[] = [];

  if (!base && compare) {
    // Page was added
    if (compare.title) {
      changes.push({
        field: 'title',
        type: 'added',
        newValue: compare.title,
        impact: 'high',
      });
    }
    if (compare.metaDescription) {
      changes.push({
        field: 'metaDescription',
        type: 'added',
        newValue: compare.metaDescription,
        impact: 'medium',
      });
    }
    if (compare.breadcrumbs.length > 0) {
      changes.push({
        field: 'breadcrumbs',
        type: 'added',
        newValue: compare.breadcrumbs.join(' > '),
        impact: 'low',
      });
    }
    if (compare.headers.length > 0) {
      changes.push(...compareHeaders([], compare.headers));
    }
    return changes;
  }

  if (base && !compare) {
    // Page was removed
    if (base.title) {
      changes.push({
        field: 'title',
        type: 'removed',
        oldValue: base.title,
        impact: 'high',
      });
    }
    if (base.breadcrumbs.length > 0) {
      changes.push({
        field: 'breadcrumbs',
        type: 'removed',
        oldValue: base.breadcrumbs.join(' > '),
        impact: 'low',
      });
    }
    if (base.headers.length > 0) {
      changes.push(...compareHeaders(base.headers, []));
    }
    return changes;
  }

  if (!base || !compare) return changes;

  // Compare fields
  if (base.title !== compare.title) {
    changes.push({
      field: 'title',
      type: 'modified',
      oldValue: base.title,
      newValue: compare.title,
      impact: 'high',
    });
  }

  if (base.metaDescription !== compare.metaDescription) {
    changes.push({
      field: 'metaDescription',
      type: 'modified',
      oldValue: base.metaDescription,
      newValue: compare.metaDescription,
      impact: 'medium',
    });
  }

  if (base.canonicalUrl !== compare.canonicalUrl) {
    changes.push({
      field: 'canonicalUrl',
      type: 'modified',
      oldValue: base.canonicalUrl,
      newValue: compare.canonicalUrl,
      impact: 'medium',
    });
  }

  if (JSON.stringify(base.breadcrumbs) !== JSON.stringify(compare.breadcrumbs)) {
    changes.push({
      field: 'breadcrumbs',
      type: 'modified',
      oldValue: base.breadcrumbs.join(' > '),
      newValue: compare.breadcrumbs.join(' > '),
      impact: 'low',
    });
  }

  // Compare headers using detailed comparison
  const headerChanges = compareHeaders(base.headers, compare.headers);
  changes.push(...headerChanges);

  // Compare custom data
  Object.keys({ ...base.customData, ...compare.customData }).forEach(key => {
    if (base.customData[key] !== compare.customData[key]) {
      changes.push({
        field: key,
        type: 'modified',
        oldValue: base.customData[key],
        newValue: compare.customData[key],
        impact: key === 'price' ? 'high' : 'low',
      });
    }
  });

  return changes;
};

export function useRunComparison(websiteId: string, runIds: string[]) {
  const [comparison, setComparison] = useState<RunComparison | null>(null);
  const [singleRunDetails, setSingleRunDetails] = useState<SingleRunDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { runs } = useScanRuns(websiteId);

  useEffect(() => {
    if (runIds.length === 0 || runs.length === 0) {
      setComparison(null);
      setSingleRunDetails(null);
      setIsLoading(false);
      return;
    }

    if (runIds.length === 1) {
      // Single run details
      const run = runs.find(r => r.id === runIds[0]);
      if (!run) {
        setIsLoading(false);
        return;
      }

      const timer = setTimeout(() => {
        const snapshots = generateMockSnapshots(run.id, websiteId, Math.min(run.totalPages, 100));
        const successfulPages = snapshots.filter(s => s.status === 'active').length;
        const errorPages = snapshots.filter(s => s.status === 'error').length;
        const averageLoadTime = snapshots.reduce((sum, s) => sum + (s.loadTime || 0), 0) / snapshots.length;

        const details: SingleRunDetails = {
          run,
          snapshots,
          summary: {
            totalPages: run.totalPages,
            successfulPages,
            errorPages,
            averageLoadTime: Math.round(averageLoadTime),
            urlsByStatus: {
              active: snapshots.filter(s => s.status === 'active').map(s => s.url),
              error: snapshots.filter(s => s.status === 'error').map(s => s.url),
            },
          },
        };

        setSingleRunDetails(details);
        setComparison(null);
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (runIds.length === 2) {
      // Comparison between two runs
      const baseRun = runs.find(r => r.id === runIds[0]);
      const compareRun = runs.find(r => r.id === runIds[1]);

      if (!baseRun || !compareRun) {
        setIsLoading(false);
        return;
      }

      // Simulate API call to get snapshots and perform comparison
      const timer = setTimeout(() => {
        const baseSnapshotsData = generateMockSnapshots(baseRun.id, websiteId, baseRun.totalPages);
        const compareSnapshotsData = generateMockSnapshots(compareRun.id, websiteId, compareRun.totalPages);

        // Create URL maps for easier comparison
        const baseMap = new Map(baseSnapshotsData.map(s => [s.url, s]));
        const compareMap = new Map(compareSnapshotsData.map(s => [s.url, s]));

        // Get all unique URLs
        const allUrls = new Set([...baseMap.keys(), ...compareMap.keys()]);

        const pageChanges: PageComparisonResult[] = [];
        let newPages: PageSnapshot[] = [];
        let removedPages: PageSnapshot[] = [];
        let modifiedPages: PageComparisonResult[] = [];
        let unchangedCount = 0;

        allUrls.forEach(url => {
          const baseSnapshot = baseMap.get(url);
          const compareSnapshot = compareMap.get(url);

          let changeType: 'added' | 'removed' | 'modified' | 'unchanged' = 'unchanged';
          let changes: FieldChange[] = [];

          if (!baseSnapshot && compareSnapshot) {
            changeType = 'added';
            newPages.push(compareSnapshot);
            changes = compareSnapshots(undefined, compareSnapshot);
          } else if (baseSnapshot && !compareSnapshot) {
            changeType = 'removed';
            removedPages.push(baseSnapshot);
            changes = compareSnapshots(baseSnapshot, undefined);
          } else if (baseSnapshot && compareSnapshot) {
            changes = compareSnapshots(baseSnapshot, compareSnapshot);
            if (changes.length > 0) {
              changeType = 'modified';
            } else {
              unchangedCount++;
            }
          }

          const severity = changes.some(c => c.impact === 'high') ? 'high' :
                          changes.some(c => c.impact === 'medium') ? 'medium' : 'low';

          const pageChange: PageComparisonResult = {
            url,
            baseSnapshot,
            compareSnapshot,
            changeType,
            changes,
            severity,
          };

          pageChanges.push(pageChange);

          if (changeType === 'modified') {
            modifiedPages.push(pageChange);
          }
        });

        const comparisonResult: RunComparison = {
          baseRun,
          compareRun,
          summary: {
            totalPages: {
              base: baseRun.totalPages,
              compare: compareRun.totalPages,
              change: compareRun.totalPages - baseRun.totalPages,
            },
            newPages,
            removedPages,
            modifiedPages,
            unchangedPages: unchangedCount,
            errorPages: {
              base: baseRun.errorPages,
              compare: compareRun.errorPages,
            },
          },
          pageChanges,
        };

        setComparison(comparisonResult);
        setSingleRunDetails(null);
        setIsLoading(false);
      }, 1500);

      return () => clearTimeout(timer);
    }

    setIsLoading(false);
  }, [runIds, runs, websiteId]);

  return {
    comparison,
    singleRunDetails,
    isLoading,
  };
}