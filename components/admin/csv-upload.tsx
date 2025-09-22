'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import Papa from 'papaparse';

interface CSVUploadProps {
  onSuccess?: (results: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface UploadResult {
  success: boolean;
  message?: string;
  summary?: {
    totalRows: number;
    successful: number;
    failed: number;
    createdProducts: Array<{
      name: string;
      slug: string;
      id: string;
    }>;
    failedProducts: Array<{
      row: number;
      name: string;
      error: string;
    }>;
  };
  error?: string;
  details?: string[];
}

export function CSVUpload({ onSuccess, onError, className = '' }: CSVUploadProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validating, setValidating] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get authorization headers
  const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      onError?.('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    setShowResults(false);
    
    // Preview CSV data
    previewCSV(selectedFile);
  };

  const previewCSV = (file: File) => {
    setValidating(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        preview: 5 // Only preview first 5 rows
      });
      
      setPreviewData(parseResult.data);
      setValidating(false);
    };
    
    reader.onerror = () => {
      onError?.('Failed to read CSV file');
      setValidating(false);
    };
    
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();
      setUploadResult(result);
      setShowResults(true);

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.error || 'Upload failed');
      }

    } catch (error) {
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadResult({
        success: false,
        error: errorMessage
      });
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/products/bulk-upload', {
        method: 'GET',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      onError?.('Failed to download template');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setPreviewData([]);
    setUploadResult(null);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if user is authenticated and has admin permissions
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in as an admin to access this feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Products</h3>
          <p className="text-sm text-gray-600">Upload multiple products at once using a CSV file</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </Button>
      </div>

      {/* File Upload Area */}
      {!file && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900">Upload CSV File</h4>
              <p className="text-gray-600 mt-1">
                Select a CSV file containing your product data
              </p>
            </div>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Select CSV File
            </Button>
          </div>
        </div>
      )}

      {/* File Selected */}
      {file && !uploading && !showResults && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <h4 className="font-medium">{file.name}</h4>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetUpload}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* CSV Preview */}
          {validating && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating CSV...</span>
            </div>
          )}

          {previewData.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium mb-2">Preview (first 5 rows):</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0] || {}).slice(0, 6).map((header) => (
                        <th key={header} className="px-3 py-2 text-left border-r">
                          {header}
                        </th>
                      ))}
                      {Object.keys(previewData[0] || {}).length > 6 && (
                        <th className="px-3 py-2 text-left">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 3).map((row, index) => (
                      <tr key={index} className="border-t">
                        {Object.values(row).slice(0, 6).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 border-r truncate max-w-32">
                            {String(value || '')}
                          </td>
                        ))}
                        {Object.keys(row).length > 6 && (
                          <td className="px-3 py-2">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleUpload}
              disabled={validating}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Products
            </Button>
            <Button variant="outline" onClick={resetUpload}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="font-medium">Processing CSV file...</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">
              Validating data and creating products...
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && uploadResult && (
        <div className="bg-white border rounded-lg p-6">
          <div className="space-y-4">
            {/* Success/Error Header */}
            <div className="flex items-center gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h4 className="font-semibold">
                  {uploadResult.success ? 'Upload Completed' : 'Upload Failed'}
                </h4>
                <p className="text-gray-600">
                  {uploadResult.message || uploadResult.error}
                </p>
              </div>
            </div>

            {/* Summary */}
            {uploadResult.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {uploadResult.summary.totalRows}
                  </div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResult.summary.successful}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadResult.summary.failed}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            )}

            {/* Error Details */}
            {!uploadResult.success && uploadResult.details && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Validation Errors:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {uploadResult.details.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                      {uploadResult.details.length > 10 && (
                        <div className="text-sm text-gray-600">
                          ...and {uploadResult.details.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Details */}
            {uploadResult.success && uploadResult.summary && (
              <div className="space-y-4">
                {/* Created Products */}
                {uploadResult.summary.createdProducts.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">
                      Successfully Created Products:
                    </h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadResult.summary.createdProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{product.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {product.slug}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed Products */}
                {uploadResult.summary.failedProducts.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">
                      Failed Products:
                    </h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadResult.summary.failedProducts.map((failure, index) => (
                        <div key={index} className="text-sm bg-red-50 p-2 rounded">
                          <div className="font-medium">Row {failure.row}: {failure.name}</div>
                          <div className="text-gray-600">{failure.error}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={resetUpload} className="bg-rose-600 hover:bg-rose-700">
                Upload Another File
              </Button>
              {uploadResult.success && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Refresh Products
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">Instructions:</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Download the template to see the required format</li>
          <li>• Fill in your product data following the template structure</li>
          <li>• Required fields: name, description, price, images, category, brand, stock</li>
          <li>• Use comma-separated values for arrays (tags, features, etc.)</li>
          <li>• Categories must match existing category names exactly</li>
          <li>• Images can be URLs or upload paths (uploads/products/filename.jpg)</li>
        </ul>
      </div>
    </div>
  );
}