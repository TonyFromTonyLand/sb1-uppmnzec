export interface Website {
  id: string;
  name: string;
  url: string;
  discoveryMethod: 'sitemap' | 'crawling';
  status: 'active' | 'paused' | 'error' | 'archived';
  lastScan: Date;
  nextScan: Date;
  totalPages: number;
  changedPages: number;
  newPages: number;
  removedPages: number;
  createdAt: Date;
  archivedAt?: Date;
  settings: WebsiteSettings;
}

export interface WebsiteSettings {
  discovery: DiscoverySettings;
  extraction: ExtractionSettings;
  scheduling?: SchedulingSettings;
}

export interface SchedulingSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  timezone: string;
  retryOnFailure: boolean;
  maxRetries: number;
  retryDelay: number; // in minutes
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    email?: string;
  };
}

export interface DiscoverySettings {
  method: 'sitemap' | 'crawling';
  sitemap: SitemapSettings;
  crawling: CrawlingSettings;
}

export interface SitemapSettings {
  urls: SitemapUrlConfig[];
  autoDetect: boolean;
  followSitemapIndex: boolean;
  validateUrls: boolean;
  timeout: number; // in seconds
  userAgent: string;
  extractionScope: 'all' | 'specific';
  specificUrls: string[]; // URLs to apply extraction to when scope is 'specific'
}

export interface SitemapUrlConfig {
  id: string;
  url: string;
  enabled: boolean;
  name: string;
  description?: string;
  extractionConfig?: ExtractionConfig;
}

export interface CrawlingSettings {
  maxDepth: number;
  maxPages: number;
  respectRobotsTxt: boolean;
  crawlDelay: number; // in milliseconds
  followExternalLinks: boolean;
  includePatterns: CrawlingPatternConfig[];
  excludePatterns: string[];
  userAgent: string;
  timeout: number; // in seconds
  maxConcurrency: number;
  followRedirects: boolean;
  extractionScope: 'all' | 'patterns';
  extractionPatterns: string[]; // URL patterns to apply extraction to
}

export interface CrawlingPatternConfig {
  id: string;
  pattern: string;
  enabled: boolean;
  name: string;
  description?: string;
  extractionConfig?: ExtractionConfig;
}

export interface ExtractionSettings {
  // Global/default extraction settings
  defaultConfig: ExtractionConfig;
  // URL-specific extraction configurations
  urlConfigs: UrlExtractionConfig[];
}

export interface UrlExtractionConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  urlPatterns: string[]; // Regex patterns or glob patterns
  priority: number; // Higher priority configs override lower ones
  extractionConfig: ExtractionConfig;
}

export interface ExtractionConfig {
  title: boolean;
  metaDescription: boolean;
  canonicalUrl: boolean;
  metaKeywords: boolean;
  openGraph: OpenGraphSettings;
  headers: HeaderSettings;
  navigation: NavigationSettings;
  content: ContentSettings;
  ecommerce: EcommerceSettings;
  customSelectors: CustomSelector[];
}

export interface OpenGraphSettings {
  enabled: boolean;
  extractTitle: boolean;
  extractDescription: boolean;
  extractImage: boolean;
  extractUrl: boolean;
  extractType: boolean;
}

export interface HeaderSettings {
  enabled: boolean;
  levels: number[]; // e.g., [1, 2, 3] for h1, h2, h3
  includeText: boolean;
  includeStructure: boolean;
  includeIds: boolean;
  includeClasses: boolean;
  maxLength: number;
}

export interface NavigationSettings {
  enabled: boolean;
  mainNavSelector: string;
  footerNavSelector: string;
  sidebarNavSelector: string;
  extractText: boolean;
  extractUrls: boolean;
  maxDepth: number;
  breadcrumbs: BreadcrumbSettings;
}

export interface BreadcrumbSettings {
  enabled: boolean;
  preset: 'custom' | 'schema' | 'bootstrap' | 'foundation' | 'bulma' | 'tailwind' | 'material';
  selectors: string[];
  separator: string;
  removeHome: boolean;
  maxDepth: number;
}

export interface ContentSettings {
  enabled: boolean;
  mainContentSelector: string;
  excludeSelectors: string[];
  includeImages: boolean;
  includeLinks: boolean;
  maxLength: number;
  preserveFormatting: boolean;
}

export interface EcommerceSettings {
  enabled: boolean;
  products: ProductSettings;
  categories: CategorySettings;
}

export interface ProductSettings {
  enabled: boolean;
  containerSelector: string;
  titleSelector: string;
  priceSelector: string;
  descriptionSelector: string;
  imageSelector: string;
  skuSelector: string;
  stockSelector: string;
  ratingSelector: string;
  reviewCountSelector: string;
  brandSelector: string;
  categorySelector: string;
  urlSelector: string;
  availabilitySelector: string;
  saleSelector: string;
  originalPriceSelector: string;
  extractVariants: boolean;
  variantSelector: string;
  trackInventory: boolean;
  trackPriceChanges: boolean;
}

export interface CategorySettings {
  enabled: boolean;
  containerSelector: string;
  nameSelector: string;
  descriptionSelector: string;
  imageSelector: string;
  urlSelector: string;
  productCountSelector: string;
  subcategorySelector: string;
  parentCategorySelector: string;
  extractHierarchy: boolean;
  maxDepth: number;
}

export interface CustomSelector {
  id: string;
  name: string;
  selector: string;
  attribute?: string; // if empty, gets text content
  enabled: boolean;
  dataType: 'text' | 'number' | 'url' | 'date' | 'boolean';
  required: boolean;
  description?: string;
}

export interface ScanRun {
  id: string;
  websiteId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  totalPages: number;
  newPages: number;
  changedPages: number;
  removedPages: number;
  errorPages: number;
  duration?: number; // in seconds
  discoveryMethod: 'sitemap' | 'crawling';
  settings: WebsiteSettings; // Settings used for this run
  error?: string;
  scannedUrls?: string[]; // List of URLs that were scanned/found
}

export interface PageSnapshot {
  id: string;
  websiteId: string;
  scanRunId: string;
  url: string;
  timestamp: Date;
  title?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  breadcrumbs: string[];
  headers: HeaderStructure[];
  customData: Record<string, string>;
  status: 'active' | 'removed' | 'error';
  responseCode?: number;
  loadTime?: number; // in milliseconds
  extractionConfigUsed?: string; // ID of the extraction config that was used
}

export interface HeaderStructure {
  level: number;
  text: string;
}

export interface PageChange {
  id: string;
  websiteId: string;
  url: string;
  changeType: 'modified' | 'added' | 'removed';
  timestamp: Date;
  changes: ChangeDetail[];
}

export interface ChangeDetail {
  field: string;
  oldValue?: string;
  newValue?: string;
  type: 'added' | 'modified' | 'removed';
}

export interface RunComparison {
  baseRun: ScanRun;
  compareRun: ScanRun;
  summary: ComparisonSummary;
  pageChanges: PageComparisonResult[];
}

export interface SingleRunDetails {
  run: ScanRun;
  snapshots: PageSnapshot[];
  summary: {
    totalPages: number;
    successfulPages: number;
    errorPages: number;
    averageLoadTime: number;
    urlsByStatus: {
      active: string[];
      error: string[];
    };
  };
}

export interface ComparisonSummary {
  totalPages: {
    base: number;
    compare: number;
    change: number;
  };
  newPages: PageSnapshot[];
  removedPages: PageSnapshot[];
  modifiedPages: PageComparisonResult[];
  unchangedPages: number;
  errorPages: {
    base: number;
    compare: number;
  };
}

export interface PageComparisonResult {
  url: string;
  baseSnapshot?: PageSnapshot;
  compareSnapshot?: PageSnapshot;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  changes: FieldChange[];
  severity: 'low' | 'medium' | 'high';
}

export interface FieldChange {
  field: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: string;
  newValue?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface BackgroundJob {
  id: string;
  websiteId: string;
  type: 'discovery' | 'extraction' | 'comparison';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface ScheduledJob {
  id: string;
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  timezone: string;
  lastRun?: Date;
  nextRun: Date;
  retryAttempts: number;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  createdAt: Date;
}