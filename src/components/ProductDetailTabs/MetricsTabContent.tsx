import React, { useState, useEffect } from 'react';
import MetricsDisplay from '../MetricsDisplay';
import MonthYearSelector from '../MonthYearSelector';
import VersionHistory from '../VersionHistory';
import { Metric } from '../../lib/types';
import { getLatestVersionedItem, getMonthYear } from '@/lib/utils';

export interface MetricsTabContentProps {
  selectedMonth: number;
  selectedYear: number;
  metrics: Metric[];
  onMonthYearChange: (month: number, year: number) => void;
  isEditMode?: boolean;
}

const MetricsTabContent: React.FC<MetricsTabContentProps> = ({
  selectedMonth,
  selectedYear,
  metrics,
  onMonthYearChange,
  isEditMode = false
}) => {
  const [selectedMetricVersion, setSelectedMetricVersion] = useState<string | null>(null);
  
  // Filter metrics for the selected month/year
  const filteredMetrics = React.useMemo(() => {
    return metrics.filter(m => m.month === selectedMonth && m.year === selectedYear);
  }, [metrics, selectedMonth, selectedYear]);
  
  // Group metrics by version
  const metricVersions = React.useMemo(() => {
    // Group by version
    const versionGroups: Record<string, Metric[]> = {};
    filteredMetrics.forEach(metric => {
      const version = metric.version?.toString() || '1.0';
      if (!versionGroups[version]) {
        versionGroups[version] = [];
      }
      versionGroups[version].push(metric);
    });
    
    // Convert to array of version groups with unique IDs based on version, month, and year
    return Object.entries(versionGroups).map(([version, metrics]) => ({
      version: parseFloat(version),
      metrics,
      id: `metrics-version-${version}-${selectedMonth}-${selectedYear}`,
      createdAt: metrics[0]?.createdAt || new Date().toISOString()
    }));
  }, [filteredMetrics, selectedMonth, selectedYear]);
  
  // Set initial selected version to the latest
  useEffect(() => {
    if (metricVersions.length > 0) {
      const latestVersion = metricVersions.sort((a, b) => b.version - a.version)[0];
      setSelectedMetricVersion(latestVersion.id);
    } else {
      setSelectedMetricVersion(null);
    }
  }, [metricVersions]);
  
  // Get the metrics to display based on selected version
  const metricsToDisplay = React.useMemo(() => {
    if (!selectedMetricVersion) return [];
    
    const selectedVersionGroup = metricVersions.find(v => v.id === selectedMetricVersion);
    return selectedVersionGroup?.metrics || [];
  }, [metricVersions, selectedMetricVersion]);
  
  // Convert version groups to format expected by VersionHistory
  const versionHistoryItems = metricVersions.map(v => ({
    id: v.id,
    version: v.version,
    createdAt: v.createdAt
  }));
  
  // Get the current version number to display
  const currentVersion = metricVersions.find(v => v.id === selectedMetricVersion)?.version || null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-blue-600">Product Metrics</h2>
          {currentVersion !== null && (
            <span className="text-sm text-gray-500">v{currentVersion}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <MonthYearSelector 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={onMonthYearChange} 
            className="compact" 
          />
          {metricVersions.length > 0 && (
            <VersionHistory 
              items={versionHistoryItems} 
              onSelect={setSelectedMetricVersion} 
              currentId={selectedMetricVersion || ""} 
              hideNewVersion={true}
            />
          )}
        </div>
      </div>
      
      {metricsToDisplay.length > 0 ? (
        <MetricsDisplay 
          metrics={metricsToDisplay} 
          detailed={true} 
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No metrics found for {getMonthYear(selectedMonth, selectedYear)}</p>
          <p className="text-sm text-gray-400">
            Total metrics available: {metrics.length}
          </p>
          {metrics.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-400">Available periods:</p>
              <ul className="text-sm text-gray-400">
                {Array.from(new Set(metrics.map(m => `${getMonthYear(m.month, m.year)}`))).map(period => (
                  <li key={period}>{period}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsTabContent;