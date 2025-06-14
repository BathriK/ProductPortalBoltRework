import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { MetricItem } from '../../lib/types'; // Changed import from Metric to MetricItem

interface MetricFormRowProps {
  metric: MetricItem; // Changed type to MetricItem
  index: number;
  onUpdate: (index: number, field: string, value: string | number) => void;
  onRemove: (index: number) => void;
}

const MetricFormRow: React.FC<MetricFormRowProps> = ({
  metric,
  index,
  onUpdate,
  onRemove
}) => {
  return (
    <TableRow key={metric.id}>
      <TableCell>
        <Input
          value={metric.name}
          onChange={(e) => onUpdate(index, 'name', e.target.value)}
          placeholder="Enter metric name"
          className="w-full tnq-font"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={metric.value}
          onChange={(e) => onUpdate(index, 'value', e.target.value)}
          placeholder="Value"
          className="w-full tnq-font"
        />
      </TableCell>
      <TableCell>
        <Input
          value={metric.unit}
          onChange={(e) => onUpdate(index, 'unit', e.target.value)}
          placeholder="Unit"
          className="w-full tnq-font"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={metric.monthlyTarget || ''}
          onChange={(e) => onUpdate(index, 'monthlyTarget', e.target.value)}
          placeholder="Monthly Target"
          className="w-full tnq-font"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={metric.annualTarget || ''}
          onChange={(e) => onUpdate(index, 'annualTarget', e.target.value)}
          placeholder="Annual Target"
          className="w-full tnq-font"
        />
      </TableCell>
      <TableCell>
        <Select
          value={metric.status}
          onValueChange={(value) => onUpdate(index, 'status', value)}
        >
          <SelectTrigger className="tnq-font">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on-track">On Track</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="off-track">Off Track</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={metric.notes || ''}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
          placeholder="Notes"
          className="w-full tnq-font"
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 size={14} />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default MetricFormRow;
