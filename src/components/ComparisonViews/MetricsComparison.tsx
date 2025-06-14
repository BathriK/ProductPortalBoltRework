import React from 'react';
import { Metric } from '../../lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsComparisonProps {
  currentMetrics: Metric[];
  previousMetrics: Metric[];
  currentPeriod: string;
  previousPeriod: string;
}

const MetricsComparison: React.FC<MetricsComparisonProps> = ({
  currentMetrics,
  previousMetrics,
  currentPeriod,
  previousPeriod
}) => {
  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getChange = (current: number, previous: number) => {
    const change = current - previous;
    const percentage = previous !== 0 ? ((change / previous) * 100).toFixed(1) : '0';
    return { absolute: change, percentage };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">{currentPeriod}</h3>
          <div className="space-y-2">
            {currentMetrics.map(metric => (
              <div key={metric.id} className="flex justify-between">
                <span className="text-sm">{metric.name}</span>
                <span className="font-medium">{metric.value} {metric.unit}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">{previousPeriod}</h3>
          <div className="space-y-2">
            {previousMetrics.map(metric => (
              <div key={metric.id} className="flex justify-between">
                <span className="text-sm">{metric.name}</span>
                <span className="font-medium">{metric.value} {metric.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>% Change</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMetrics.map(currentMetric => {
              const previousMetric = previousMetrics.find(p => p.name === currentMetric.name);
              if (!previousMetric) return null;
              
              const change = getChange(currentMetric.value, previousMetric.value);
              
              return (
                <TableRow key={currentMetric.id}>
                  <TableCell>{currentMetric.name}</TableCell>
                  <TableCell className={change.absolute > 0 ? 'text-green-600' : change.absolute < 0 ? 'text-red-600' : 'text-gray-600'}>
                    {change.absolute > 0 ? '+' : ''}{change.absolute} {currentMetric.unit}
                  </TableCell>
                  <TableCell className={change.absolute > 0 ? 'text-green-600' : change.absolute < 0 ? 'text-red-600' : 'text-gray-600'}>
                    {change.absolute > 0 ? '+' : ''}{change.percentage}%
                  </TableCell>
                  <TableCell>
                    {getChangeIcon(currentMetric.value, previousMetric.value)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MetricsComparison;