/**
 * API Response Type Definitions
 * 
 * Common interfaces for API responses, errors, and pagination
 */

// Generic API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: PaginationInfo;
  timestamp: string;
}

// Pagination information
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Error response structure
export interface ApiError {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  errors?: Record<string, string[]>;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Database operation result
export interface DbOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  affectedCount?: number;
}

// Search result structure
export interface SearchResult<T = any> {
  items: T[];
  totalCount: number;
  searchQuery: string;
  filters?: Record<string, any>;
  suggestions?: string[];
  facets?: SearchFacets;
}

// Search facets for filtering
export interface SearchFacets {
  categories: Array<{ name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  priceRanges: Array<{ range: string; count: number }>;
  ratings: Array<{ rating: number; count: number }>;
  availability: Array<{ status: string; count: number }>;
}

// File upload response
export interface FileUploadResponse {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
  thumbnails?: Array<{
    size: string;
    url: string;
  }>;
}

// Bulk operation response
export interface BulkOperationResponse {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{
    item: any;
    error: string;
  }>;
  results?: Array<{
    item: any;
    success: boolean;
    data?: any;
    error?: string;
  }>;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  version: string;
  environment: string;
}

// Rate limit response headers
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Analytics data structure
export interface AnalyticsData {
  period: string;
  metrics: Record<string, number>;
  trends: Record<string, {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  }>;
  charts: Array<{
    name: string;
    data: Array<{
      label: string;
      value: number;
      timestamp?: string;
    }>;
  }>;
}

// Export/Import response
export interface ExportResponse {
  filename: string;
  url: string;
  format: 'csv' | 'xlsx' | 'json';
  recordCount: number;
  expiresAt: string;
}

export interface ImportResponse {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  warnings?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

// Notification response
export interface NotificationResponse {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: Array<{
    label: string;
    url: string;
    type: 'primary' | 'secondary';
  }>;
}

// System configuration response
export interface SystemConfigResponse {
  features: Record<string, boolean>;
  limits: Record<string, number>;
  settings: Record<string, any>;
  maintenance: {
    enabled: boolean;
    message?: string;
    scheduledAt?: string;
  };
}

// Webhook payload structure
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature: string;
  version: string;
}

// Cache response metadata
export interface CacheMetadata {
  cached: boolean;
  cacheKey?: string;
  ttl?: number;
  createdAt?: string;
  expiresAt?: string;
}