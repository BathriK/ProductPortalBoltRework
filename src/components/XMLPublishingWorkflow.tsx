// src/components/XMLPublishingWorkflow.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, List, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { xmlApiService } from '@/services/xmlApiService';
import { getPortfolios } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const XMLPublishingWorkflow: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [publishedFiles, setPublishedFiles] = useState<string[]>([]);
  const [lastPublishResult, setLastPublishResult] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [publishHistory, setPublishHistory] = useState<Array<{
    timestamp: string;
    success: boolean;
    files: number;
    error?: string;
  }>>([]);
  const { toast } = useToast();

  // Helper function to delay execution
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handlePublishAll = async () => {
    setIsLoading(true);
    setLastPublishResult(null);
    
    try {
      console.log('Starting publish workflow...');
      
      // Get all portfolios data
      const portfolios = await getPortfolios();
      console.log('Loaded portfolios:', portfolios.length);

      if (!portfolios || portfolios.length === 0) {
        throw new Error('No portfolios found to publish');
      }

      // Generate XML content for each product
      const publishItems: Array<{ path: string; content: string }> = [];
      
      for (const portfolio of portfolios) {
        for (const product of portfolio.products) {
          // Generate XML content
          const xmlContent = xmlApiService.generateProductXML(product);
          
          // Create safe filename
          const safeName = product.name.replace(/[^\w\-]/g, '-');
          const path = `${safeName}-${product.id}.xml`;
          
          publishItems.push({ path, content: xmlContent });
        }
      }
      
      // Generate combined XML
      const allProductsXML = xmlApiService.generatePortfolioXML(portfolios);
      publishItems.push({ path: 'all-products.xml', content: allProductsXML });
      
      console.log(`Publishing ${publishItems.length} XML files...`);
      
      // Publish each item directly using storageService
      const results = [];
      let successCount = 0;
      
      for (const item of publishItems) {
        try {
          // Add a small delay between operations to avoid rate limiting
          await delay(500);
          
          const success = await storageService.publish(item.path, item.content);
            
          if (!success) {
            console.error(`Error publishing ${item.path}`);
            results.push({ path: item.path, success: false, error: "Failed to publish" });
          } else {
            console.log(`Successfully published: ${item.path}`);
            results.push({ path: item.path, success: true });
            successCount++;
          }
        } catch (itemError) {
          console.error(`Exception publishing ${item.path}:`, itemError);
          results.push({ 
            path: item.path, 
            success: false, 
            error: itemError instanceof Error ? itemError.message : 'Unknown error' 
          });
        }
      }
      
      // Create result object
      const result = {
        success: successCount > 0,
        data: {
          publishedCount: successCount,
          totalCount: publishItems.length,
          results,
          paths: publishItems.map(item => item.path)
        }
      };
      
      // Add to publish history
      const historyEntry = {
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        success: result.success,
        files: successCount,
        error: successCount < publishItems.length ? 
          `Failed to publish ${publishItems.length - successCount} files` : undefined
      };
      setPublishHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      
      setLastPublishResult(result);
      
      if (result.success) {
        toast({
          title: "Publishing Successful",
          description: `Successfully published ${result.data?.publishedCount || 0} out of ${result.data?.totalCount || 0} XML files`,
        });
        
        // Refresh the published files list
        await loadPublishedFiles();
      } else {
        toast({
          title: "Publishing Failed",
          description: "Failed to publish XML files",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Publish workflow error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during publishing';
      
      // Add to publish history
      const historyEntry = {
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        success: false,
        files: 0,
        error: errorMessage
      };
      setPublishHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      
      setLastPublishResult({
        success: false,
        error: errorMessage
      });
      
      toast({
        title: "Publishing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublishedFiles = async () => {
    setIsRefreshing(true);
    try {
      // Add a small delay before listing files
      await delay(500);
      
      // Use storageService to list files
      const files = await storageService.list('published');
      setPublishedFiles(files);
      console.log('Loaded published files:', files.length);
    } catch (error) {
      console.error('Error loading published files:', error);
      toast({
        title: "Error loading files",
        description: "Failed to load published files",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownloadXML = async (filename: string) => {
    try {
      // Use storageService to load the file
      const content = await storageService.load(`published/${filename}`);
      
      if (!content) {
        toast({
          title: "Download Failed",
          description: "No data returned when loading test file",
          variant: "destructive",
        });
        return;
      }
      
      // Create download link
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download XML file",
        variant: "destructive",
      });
    }
  };

  const testStorageConnection = async () => {
    setIsLoading(true);
    try {
      console.log('Testing storage connection...');
      
      const testContent = `<?xml version="1.0" encoding="UTF-8"?>
<Test>
  <Message>Storage connection test at ${new Date().toISOString()}</Message>
</Test>`;
      
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const testPath = `test/connection-test-${timestamp}.xml`;
      
      // Test save using storageService
      console.log('Testing save operation...');
      const saveResult = await storageService.save(testPath, testContent);
      if (!saveResult) {
        throw new Error('Failed to save test file to storage');
      }
      console.log('Save test successful');
      
      // Add a small delay between operations
      await delay(1000);
      
      // Test load using storageService
      console.log('Testing load operation...');
      const loadResult = await storageService.load(testPath);
      if (!loadResult) {
        throw new Error('Failed to load test file from storage');
      }
      console.log('Load test successful');
      
      // Add a small delay between operations
      await delay(1000);
      
      // Test delete using storageService
      console.log('Testing delete operation...');
      const deleteResult = await storageService.delete(testPath);
      if (!deleteResult) {
        console.warn('Failed to delete test file (this is okay):', deleteResult);
      } else {
        console.log('Delete test successful');
      }
      
      toast({
        title: "Storage Test Successful",
        description: "Storage is working correctly",
      });
      
    } catch (error) {
      console.error('Storage test error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during storage test";
      toast({
        title: "Storage Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedFiles();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>XML Publishing Workflow</CardTitle>
          <CardDescription>
            Publish product data to Supabase Storage and manage XML files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handlePublishAll} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              {isLoading ? 'Publishing...' : 'Publish All Products'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testStorageConnection}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {isLoading ? 'Testing...' : 'Test Storage'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadPublishedFiles}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh List
            </Button>
          </div>

          {lastPublishResult && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {lastPublishResult.success ? (
                  <CheckCircle className="text-green-500\" size={16} />
                ) : (
                  <AlertCircle className="text-red-500\" size={16} />
                )}
                <span className="font-medium">
                  Last Publish Result: {lastPublishResult.success ? 'Success' : 'Failed'}
                </span>
              </div>
              {lastPublishResult.success && lastPublishResult.data && (
                <div className="text-sm text-gray-600">
                  <p>Published {lastPublishResult.data.publishedCount} out of {lastPublishResult.data.totalCount} files</p>
                  {lastPublishResult.data.results && (
                    <div className="mt-2">
                      <p className="font-medium">Details:</p>
                      <ul className="list-disc list-inside ml-2">
                        {lastPublishResult.data.results.map((result: any, index: number) => (
                          <li key={index} className={result.success ? 'text-green-600' : 'text-red-600'}>
                            {result.path}: {result.success ? 'Success' : result.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {!lastPublishResult.success && (
                <p className="text-sm text-red-600">
                  Error: {lastPublishResult.error}
                </p>
              )}
            </div>
          )}
          
          {/* Publish History */}
          {publishHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Publish History</h3>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Timestamp</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Files</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {publishHistory.map((entry, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-xs text-gray-500">{entry.timestamp}</td>
                        <td className="px-3 py-2">
                          {entry.success ? (
                            <Badge className="bg-green-100 text-green-800">Success</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {entry.files} {entry.error && <span title={entry.error}>⚠️</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published XML Files</CardTitle>
          <CardDescription>
            Manage and download published XML files from Supabase Storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {publishedFiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No published files found</p>
              <Button variant="outline" onClick={loadPublishedFiles} disabled={isRefreshing}>
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin mr-2' : 'mr-2'} />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {publishedFiles.map((filename) => (
                <div key={filename} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">XML</Badge>
                    <span className="font-medium">{filename}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadXML(filename)}
                      className="flex items-center gap-1"
                    >
                      <Download size={14} />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default XMLPublishingWorkflow;