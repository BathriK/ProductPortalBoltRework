import React from 'react';
import { Metric, MetricItem } from '../lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsDisplayProps {
  metrics: Metric[];
  detailed?: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics, detailed = false }) => {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No metrics data available for this period.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'on-track': 'bg-green-100 text-green-800',
      'at-risk': 'bg-yellow-100 text-yellow-800', 
      'off-track': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'on-track' ? 'On Track' : status === 'at-risk' ? 'At Risk' : 'Off Track'}
      </span>
    );
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (previous === undefined || previous === null) return <Minus size={16} className="text-gray-400" />;
    
    if (current > previous) {
      return <TrendingUp size={16} className="text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown size={16} className="text-red-600" />;
    } else {
      return <Minus size={16} className="text-gray-400" />;
    }
  };

  const formatTarget = (target?: number) => {
    return target !== undefined && target !== null ? target.toString() : 'N/A';
  };

  if (detailed) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-tnq-navyBlue">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Metric Name</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Value</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Unit</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Monthly Target</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Annual Target</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Status</th>
              <th className="text-left py-3 px-4 font-medium text-white text-sm">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {metrics.flatMap((metric) => 
              metric.metricItems.map((item) => (
                <tr key={item.id} title={item.notes || 'No notes available'}>
                  <td className="py-3 px-4 text-tnq-navy text-sm font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-tnq-navy text-sm">{item.value}</td>
                  <td className="py-3 px-4 text-tnq-navy text-sm">{item.unit}</td>
                  <td className="py-3 px-4 text-tnq-navy text-sm">{formatTarget(item.monthlyTarget)}</td>
                  <td className="py-3 px-4 text-tnq-navy text-sm">{formatTarget(item.annualTarget)}</td>
                  <td className="py-3 px-4 text-sm">{getStatusBadge(item.status || 'on-track')}</td>
                  <td className="py-3 px-4">{getTrendIcon(item.value, item.previousValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Dashboard view with responsive grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.flatMap((metric) => 
        metric.metricItems.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border" title={item.notes || 'No notes available'}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-tnq-navy truncate">{item.name}</h3>
              <div className="flex items-center gap-1">
                {getTrendIcon(item.value, item.previousValue)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-tnq-navy">{item.value}</span>
                <span className="text-sm text-gray-500">{item.unit}</span>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <div>Monthly Target: {formatTarget(item.monthlyTarget)}</div>
                <div>Annual Target: {formatTarget(item.annualTarget)}</div>
              </div>
              
              <div className="flex justify-between items-center">
                {getStatusBadge(item.status || 'on-track')}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MetricsDisplay;
