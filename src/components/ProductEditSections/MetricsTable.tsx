import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricItem } from '../../lib/types'; // Changed from Metric to MetricItem
import MetricFormRow from './MetricFormRow';

interface MetricsTableProps {
  metrics: MetricItem[]; // Changed type to MetricItem[]
  onUpdateMetric: (index: number, field: string, value: string | number) => void;
  onRemoveMetric: (index: number) => void;
}

const MetricsTable: React.FC<MetricsTableProps> = ({
  metrics,
  onUpdateMetric,
  onRemoveMetric
}) => {
  return (
    <div className="overflow-x-auto">
      <Table className="tnq-table min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="tnq-grid-header">Metric Name</TableHead>
            <TableHead className="tnq-grid-header">Value</TableHead>
            <TableHead className="tnq-grid-header">Unit</TableHead>
            <TableHead className="tnq-grid-header">Monthly Target</TableHead>
            <TableHead className="tnq-grid-header">Annual Target</TableHead>
            <TableHead className="tnq-grid-header">Status</TableHead>
            <TableHead className="tnq-grid-header">Notes</TableHead>
            <TableHead className="tnq-grid-header w-20">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric, index) => (
            <MetricFormRow
              key={metric.id}
              metric={metric} // This will now be a MetricItem
              index={index}
              onUpdate={onUpdateMetric}
              onRemove={onRemoveMetric}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MetricsTable;
