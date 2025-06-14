
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface AppConfig {
  xmlFilePath: string;
}

const AppConfigManager: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({ xmlFilePath: '/public/data/PortfolioProduct.xml' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load current configuration
    const storedConfig = localStorage.getItem('appConfig');
    if (storedConfig) {
      try {
        setConfig(JSON.parse(storedConfig));
      } catch (error) {
        console.error('Error loading app config:', error);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('appConfig', JSON.stringify(config));
      toast({
        title: "Configuration saved",
        description: "XML file path has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error saving configuration",
        description: "Could not save the configuration",
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(config.xmlFilePath);
      if (response.ok) {
        const xmlText = await response.text();
        if (xmlText.trim().length > 0) {
          toast({
            title: "Connection successful",
            description: "XML file is accessible and contains data",
          });
        } else {
          toast({
            title: "File found but empty",
            description: "XML file exists but contains no data",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Connection failed",
          description: `Could not access XML file: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Could not reach the XML file path",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium mb-4">XML File Configuration</h3>
      <p className="text-sm text-gray-600 mb-4">
        Configure the path to your PortfolioProduct.xml file. This can be a local file path or a network drive path.
      </p>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="xmlPath">XML File Path</Label>
          <Input
            id="xmlPath"
            type="text"
            value={config.xmlFilePath}
            onChange={(e) => setConfig({ ...config, xmlFilePath: e.target.value })}
            placeholder="/public/data/PortfolioProduct.xml"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: /data/PortfolioProduct.xml or \\server\share\data\PortfolioProduct.xml
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleSave} variant="default">
            Save Configuration
          </Button>
          <Button 
            onClick={handleTest} 
            variant="outline" 
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppConfigManager;
