import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { clearPortfolioCache } from "@/lib/data";
import { storageService } from '@/services/storageService';
import { supabase } from '@/integrations/supabase/client';
import DataExportImport from "../components/DataExportImport";
import XMLPublishingWorkflow from '../components/XMLPublishingWorkflow';
import {
  Database,
  Server,
  HardDrive,
  Cloud,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Trash2,
  FileText,
  Settings,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { adminLogger } from '@/lib/adminLogger'; // Import adminLogger

const Config = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("storage");
  const [storageType, setStorageType] = useState<'local' | 'supabase'>('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState(supabase.supabaseUrl || "");
  const [supabaseKey, setSupabaseKey] = useState(supabase.supabaseKey || "");
  const [bucketName, setBucketName] = useState("xml-storage");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<Array<{
    level: 'INFO' | 'WARN' | 'ERROR',
    action: string,
    details: string,
    timestamp: string
  }>>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'INFO' | 'WARN' | 'ERROR'>('all');
  const [storageInfo, setStorageInfo] = useState({
    xmlLocation: '/public/data/',
    localStorageKey: 'portfolios',
    cacheDuration: '5 seconds',
    fallbackStrategy: 'Supabase → Local Storage → XML Files'
  });
  const [systemStatus, setSystemStatus] = useState({
    dataLoaded: true,
    cacheValid: true,
    storageConnected: true,
    lastSync: new Date().toISOString()
  });

  // Load current configuration from localStorage on component mount
  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem('appStorageConfig');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        console.log('Config: Loading stored config from localStorage:', parsedConfig);
        setStorageType(parsedConfig.storageType || 'supabase');
        setSupabaseUrl(parsedConfig.supabaseUrl || supabase.supabaseUrl);
        setBucketName(parsedConfig.bucketName || 'xml-storage');
      } else {
        // If no stored config, initialize with default values
        console.log('Config: No stored config found, using defaults');
        setStorageType('supabase');
        setSupabaseUrl(supabase.supabaseUrl);
        setBucketName('xml-storage');
      }
    } catch (error) {
      console.error('Config: Error loading config from localStorage:', error);
    }
  }, []);

  const loadAdminLogs = useCallback(() => {
    try {
      const storedLogs = localStorage.getItem('adminExecutionLogs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        setLogs(parsedLogs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading admin logs from localStorage:', error);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    loadAdminLogs(); // Load logs on component mount

    // Add some initial logs
    adminLogger('Configuration page loaded', {}, 'INFO');
    adminLogger('Storage backend initialized', { type: storageType }, 'INFO');
    adminLogger('XML files location', { location: storageInfo.xmlLocation }, 'INFO');
    
    // Check system status
    checkSystemStatus();
  }, [loadAdminLogs]);

  const checkSystemStatus = async () => {
    try {
      // Check if data is loaded
      const portfolios = localStorage.getItem('portfolios');
      const dataLoaded = !!portfolios;
      
      // Check if cache is valid (less than 5 minutes old)
      const lastCacheUpdate = localStorage.getItem('lastCacheUpdate');
      const cacheValid = lastCacheUpdate && 
        (new Date().getTime() - new Date(lastCacheUpdate).getTime() < 5 * 60 * 1000);
      
      // Check storage connection
      let storageConnected = true;
      if (storageType === 'supabase') {
        try {
          const testResult = await testConnection(false);
          storageConnected = testResult;
        } catch (error) {
          storageConnected = false;
        }
      }
      
      setSystemStatus({
        dataLoaded,
        cacheValid: cacheValid || false,
        storageConnected,
        lastSync: lastCacheUpdate || new Date().toISOString()
      });
      
      adminLogger('System status checked', { status: systemStatus }, 'INFO');
    } catch (error) {
      console.error('Error checking system status:', error);
      adminLogger('Failed to check system status', { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
    }
  };

  const handleStorageTypeChange = (type: 'local' | 'supabase') => {
    setStorageType(type);
    adminLogger('Storage type changed', { newType: type }, 'INFO');
  };

  const saveConfiguration = () => {
    try {
      // Save configuration to localStorage
      const config = {
        storageType,
        supabaseUrl,
        bucketName,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('appStorageConfig', JSON.stringify(config));
      
      // Update storage service configuration
      storageService.switchBackend({
        type: storageType,
        supabaseUrl,
        supabaseKey,
        bucketName
      });
      
      adminLogger('Configuration saved successfully', { config }, 'INFO');
      toast({
        title: "Configuration Saved",
        description: "Your storage configuration has been updated",
      });
      
      // Update system status
      checkSystemStatus();
    } catch (error) {
      console.error('Error saving configuration:', error);
      adminLogger('Failed to save configuration', { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
      toast({
        title: "Save Failed",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const testConnection = async (showToast = true): Promise<boolean> => {
    if (showToast) {
      setIsTestingConnection(true);
      setConnectionStatus('idle');
    }
    adminLogger('Testing storage connection', { storageType }, 'INFO');
    
    try {
      const testContent = `<?xml version="1.0" encoding="UTF-8"?>
<Test>
  <Message>Storage connection test at ${new Date().toISOString()}</Message>
</Test>`;
      
      const testPath = `test/connection-test-${Date.now()}.xml`;
      
      // Configure storage service for the test
      storageService.switchBackend({
        type: storageType,
        supabaseUrl,
        supabaseKey,
        bucketName
      });
      
      // If using Supabase, ensure the bucket exists
      if (storageType === 'supabase') {
        adminLogger('Checking if bucket exists', { bucketName }, 'INFO');
        try {
          // Check if bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(b => b.name === bucketName);
          
          if (!bucketExists) {
            adminLogger(`Bucket "${bucketName}" does not exist, creating it...`, {}, 'INFO');
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
              public: false
            });
            
            if (createError) {
              adminLogger(`Failed to create bucket: ${createError.message}`, {}, 'WARN');
            } else {
              adminLogger(`Bucket "${bucketName}" created successfully`, {}, 'INFO');
            }
            
            // Add a small delay after bucket creation
            await delay(1000);
          } else {
            adminLogger(`Bucket "${bucketName}" already exists`, {}, 'INFO');
          }
        } catch (bucketError) {
          adminLogger(`Error checking/creating bucket: ${bucketError instanceof Error ? bucketError.message : String(bucketError)}`, {}, 'WARN');
        }
      }
      
      // Test save
      adminLogger('Testing save operation', { path: testPath }, 'INFO');
      const saveResult = await storageService.save(testPath, testContent);
      if (!saveResult) {
        throw new Error('Failed to save test file to storage');
      }
      adminLogger('Save test successful', { path: testPath }, 'INFO');
      
      // Add a small delay between operations
      await delay(1000);
      
      // Test load
      adminLogger('Testing load operation', { path: testPath }, 'INFO');
      const loadResult = await storageService.load(testPath);
      if (!loadResult) {
        throw new Error('Failed to load test file from storage');
      }
      adminLogger('Load test successful', { path: testPath }, 'INFO');
      
      // Add a small delay between operations
      await delay(1000);
      
      // Test delete
      adminLogger('Testing delete operation', { path: testPath }, 'INFO');
      const deleteResult = await storageService.delete(testPath);
      if (!deleteResult) {
        adminLogger('Failed to delete test file (this is okay)', { path: testPath }, 'WARN');
      } else {
        adminLogger('Delete test successful', { path: testPath }, 'INFO');
      }
      
      if (showToast) {
        setConnectionStatus('success');
      }
      adminLogger('Connection test completed successfully', {}, 'INFO');
      
      if (showToast) {
        toast({
          title: "Connection Successful",
          description: "Storage connection is working properly",
        });
      }
      
      return true;
    } catch (error) {
      console.error('Connection test error:', error);
      if (showToast) {
        setConnectionStatus('error');
      }
      adminLogger(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
      
      if (showToast) {
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      if (showToast) {
        setIsTestingConnection(false);
      }
    }
  };

  const clearCache = () => {
    try {
      clearPortfolioCache();
      localStorage.removeItem('productPortalConfig');
      localStorage.removeItem('lastCacheUpdate');
      adminLogger('Cache cleared successfully', {}, 'INFO');
      toast({
        title: "Cache Cleared",
        description: "Application cache has been cleared. Data will be reloaded from source.",
      });
      
      // Update system status
      checkSystemStatus();
    } catch (error) {
      console.error('Error clearing cache:', error);
      adminLogger(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`, { error: error instanceof Error ? error.message : String(error) }, 'ERROR');
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });

  const getLogIcon = (level: 'INFO' | 'WARN' | 'ERROR') => {
    switch (level) {
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        OK
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Error
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-tnq-navy mb-6">Application Configuration</h1>
        
        {/* System Status Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-sm font-medium mb-1">Data Loaded</div>
                <div>{getStatusBadge(systemStatus.dataLoaded)}</div>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-sm font-medium mb-1">Cache Valid</div>
                <div>{getStatusBadge(systemStatus.cacheValid)}</div>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Cloud className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-sm font-medium mb-1">Storage</div>
                <div>{getStatusBadge(systemStatus.storageConnected)}</div>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <RefreshCw className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-sm font-medium mb-1">Last Sync</div>
                <div className="text-xs text-gray-600">
                  {new Date(systemStatus.lastSync).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm inline-flex gap-2">
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Storage Configuration
            </TabsTrigger>
            <TabsTrigger value="publishing" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              XML Publishing
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Admin Logs
            </TabsTrigger>
          </TabsList>

          {/* Storage Configuration Tab */}
          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Storage Configuration
                </CardTitle>
                <CardDescription>
                  Configure storage backend for XML files and data persistence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Storage Backend</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                      <Card className={`flex-1 cursor-pointer border-2 ${storageType === 'local' ? 'border-tnq-blue' : 'border-gray-200'}`}
                        onClick={() => handleStorageTypeChange('local')}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Local Storage
                            {storageType === 'local' && <Badge className="ml-2 bg-tnq-blue">Active</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600">
                            Store data locally in browser storage. Good for development and standalone use.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className={`flex-1 cursor-pointer border-2 ${storageType === 'supabase' ? 'border-tnq-blue' : 'border-gray-200'}`}
                        onClick={() => handleStorageTypeChange('supabase')}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Cloud className="h-4 w-4" />
                            Supabase Cloud
                            {storageType === 'supabase' && <Badge className="ml-2 bg-tnq-blue">Active</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600">
                            Store data in Supabase cloud storage. Enables sharing and collaboration.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {storageType === 'supabase' && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <Label htmlFor="supabase-url">Supabase URL</Label>
                        <Input
                          id="supabase-url"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          placeholder="https://your-project.supabase.co"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                        <Input
                          id="supabase-key"
                          type="password"
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="bucket-name">Storage Bucket Name</Label>
                        <Input
                          id="bucket-name"
                          value={bucketName}
                          onChange={(e) => setBucketName(e.target.value)}
                          placeholder="xml-storage"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button onClick={saveConfiguration}>
                      Save Configuration
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => testConnection(true)}
                      disabled={isTestingConnection}
                      className="flex items-center gap-2"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : connectionStatus === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : connectionStatus === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">XML Files Location:</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">{storageInfo.xmlLocation}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Local Storage Key:</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">{storageInfo.localStorageKey}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Cache Duration:</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">{storageInfo.cacheDuration}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Fallback Strategy:</p>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">{storageInfo.fallbackStrategy}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* XML Publishing Tab */}
          <TabsContent value="publishing">
            <XMLPublishingWorkflow />
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Manage application data, import/export, and cache settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Data Export and Import</h3>
                  <DataExportImport />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Local Data Cache</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Clear the local data cache to force reload from XML files. This is useful if you've made changes to the XML files directly.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={clearCache}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Data Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Admin Execution Logs
                  </CardTitle>
                  <CardDescription>
                    View system logs for debugging and monitoring
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className="px-2 py-1 border rounded-md text-sm"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value as any)}
                  >
                    <option value="all">All Levels</option>
                    <option value="INFO">Info Only</option>
                    <option value="WARN">Warnings Only</option>
                    <option value="ERROR">Errors Only</option>
                  </select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLogs([])}
                  >
                    Clear Logs
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadAdminLogs} // Refresh logs button
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-2 border-b flex items-center justify-between text-sm font-medium">
                    <div className="w-20">Level</div>
                    <div className="w-24">Time</div>
                    <div className="flex-1">Action</div>
                    <div className="flex-1">Details</div>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto logs-container">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log, index) => (
                        <div 
                          key={index} 
                          className={`p-2 border-b flex items-start text-sm ${
                            log.level === 'ERROR' ? 'bg-red-50' : 
                            log.level === 'WARN' ? 'bg-amber-50' : 
                            'bg-white'
                          }`}
                        >
                          <div className="w-20 flex items-center gap-1">
                            {getLogIcon(log.level)}
                            <span className={
                              log.level === 'ERROR' ? 'text-red-700' : 
                              log.level === 'WARN' ? 'text-amber-700' : 
                              'text-blue-700'
                            }>
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                          <div className="w-24 text-gray-500">{formatTimestamp(log.timestamp)}</div>
                          <div className="flex-1">{log.action}</div>
                          <div className="flex-1 text-gray-600 text-xs break-all">{log.details}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No logs to display
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Config;