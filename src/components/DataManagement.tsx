
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from '../hooks/use-toast';
import { RefreshCw, Database } from 'lucide-react';
import { usePermissions } from '../contexts/AuthContext';

const DataManagement: React.FC = () => {
  const { isAdmin } = usePermissions();
  
  // Only show for admin users
  if (!isAdmin) {
    return null;
  }

  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshFromSupabase = async () => {
    setIsLoading(true);
    try {
      toast({
        title: "Data Refreshed",
        description: "Portfolio data has been refreshed from Supabase",
      });
      
      // Reload the page to see changes
      window.location.reload();
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data from Supabase",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Supabase Integration
        </CardTitle>
        <CardDescription>
          Your portfolio data is managed through Supabase database. 
          All portfolios, products, metrics, roadmaps, goals, plans, and release notes are stored in the database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supabase Actions */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Data Actions</h3>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleRefreshFromSupabase}
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh from Supabase
            </Button>
          </div>
        </div>

        {/* Database Structure Guide */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Database Structure:</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <div><strong>Portfolios:</strong> Portfolio ID, Name, Description</div>
            <div><strong>Products:</strong> Product ID, Name, Description, Portfolio ID</div>
            <div><strong>Metrics:</strong> Product metrics with monthly/yearly targets</div>
            <div><strong>Roadmap:</strong> Product roadmaps with quarterly items</div>
            <div><strong>Release Goals:</strong> Monthly release goals and targets</div>
            <div><strong>Release Plans:</strong> Feature plans and development items</div>
            <div><strong>Release Notes:</strong> Release documentation and highlights</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">How to Use:</h4>
          <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
            <li>Data is automatically loaded from Supabase on page load</li>
            <li>Edit data directly in the Supabase database or through the app interface</li>
            <li>Use "Refresh from Supabase" to update the portal with latest changes</li>
            <li>All changes are persisted in the Supabase database</li>
          </ol>
        </div>

        {/* Connection Info */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Connection Details:</h4>
          <p className="text-sm text-gray-700">
            Project ID: <code className="bg-gray-100 px-1 rounded">yxlwsqpcdeiimvcefmko</code>
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Database: Connected to Supabase PostgreSQL
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagement;
