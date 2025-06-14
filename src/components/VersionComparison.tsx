
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { GitCompare } from 'lucide-react';
import { Product } from '../lib/types';
import { getMonthName } from '../lib/utils';

interface VersionComparisonProps {
  product: Product;
  selectedMonth: number;
  selectedYear: number;
  comparisonType: 'goals' | 'plans' | 'metrics';
}

const VersionComparison: React.FC<VersionComparisonProps> = ({
  product,
  selectedMonth,
  selectedYear,
  comparisonType
}) => {
  const [version1, setVersion1] = useState<number>(1);
  const [version2, setVersion2] = useState<number>(2);

  // Get available versions for the selected period
  const getAvailableVersions = () => {
    let items: any[] = [];
    
    switch (comparisonType) {
      case 'goals':
        items = product.releaseGoals?.filter(g => g.month === selectedMonth && g.year === selectedYear) || [];
        break;
      case 'plans':
        items = product.releasePlans?.filter(p => p.month === selectedMonth && p.year === selectedYear) || [];
        break;
      case 'metrics':
        // For metrics, we'll group by version (assuming version field exists)
        items = product.metrics?.filter(m => m.month === selectedMonth && m.year === selectedYear) || [];
        break;
    }
    
    const versions = [...new Set(items.map(item => item.version || 1))].sort((a, b) => b - a);
    return versions;
  };

  const availableVersions = getAvailableVersions();

  const getVersionData = (version: number) => {
    switch (comparisonType) {
      case 'goals':
        return product.releaseGoals?.find(g => 
          g.month === selectedMonth && g.year === selectedYear && g.version === version
        );
      case 'plans':
        return product.releasePlans?.find(p => 
          p.month === selectedMonth && p.year === selectedYear && p.version === version
        );
      case 'metrics':
        return product.metrics?.filter(m => 
          m.month === selectedMonth && m.year === selectedYear && (m.version || 1) === version
        );
      default:
        return null;
    }
  };

  const version1Data = getVersionData(version1);
  const version2Data = getVersionData(version2);

  const renderComparisonContent = () => {
    if (!version1Data || !version2Data) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Select versions to compare</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Version {version1}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderVersionContent(version1Data)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Version {version2}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderVersionContent(version2Data)}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderVersionContent = (data: any) => {
    if (comparisonType === 'goals' && data?.goals) {
      return (
        <div className="space-y-2">
          {data.goals.map((goal: any, index: number) => (
            <div key={index} className="p-2 border rounded">
              <div className="font-medium">{goal.title}</div>
              <div className="text-sm text-gray-600">{goal.description}</div>
              <Badge variant="outline">{goal.status}</Badge>
            </div>
          ))}
        </div>
      );
    }
    
    if (comparisonType === 'plans' && data?.items) {
      return (
        <div className="space-y-2">
          {data.items.map((item: any, index: number) => (
            <div key={index} className="p-2 border rounded">
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-600">{item.description}</div>
              <Badge variant="outline">{item.status}</Badge>
            </div>
          ))}
        </div>
      );
    }
    
    if (comparisonType === 'metrics' && Array.isArray(data)) {
      return (
        <div className="space-y-2">
          {data.map((metric: any, index: number) => (
            <div key={index} className="p-2 border rounded">
              <div className="font-medium">{metric.name}</div>
              <div className="text-sm text-gray-600">
                {metric.value} {metric.unit}
              </div>
              <Badge variant="outline">{metric.status}</Badge>
            </div>
          ))}
        </div>
      );
    }
    
    return <div className="text-gray-500">No data available</div>;
  };

  if (availableVersions.length < 2) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Insufficient Versions
          </h3>
          <p className="text-gray-500">
            At least 2 versions are required for comparison in {getMonthName(selectedMonth)} {selectedYear}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div>
          <label className="text-sm font-medium mb-1 block">Version 1</label>
          <Select value={version1.toString()} onValueChange={(value) => setVersion1(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableVersions.map(v => (
                <SelectItem key={v} value={v.toString()}>Version {v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="mt-6">
          <GitCompare className="h-6 w-6 text-gray-400" />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">Version 2</label>
          <Select value={version2.toString()} onValueChange={(value) => setVersion2(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableVersions.map(v => (
                <SelectItem key={v} value={v.toString()}>Version {v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {renderComparisonContent()}
    </div>
  );
};

export default VersionComparison;
