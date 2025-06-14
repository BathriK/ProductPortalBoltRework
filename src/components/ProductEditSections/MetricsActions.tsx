import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Save, Clipboard } from 'lucide-react';

interface MetricsActionsProps {
  onAddMetric: () => void;
  onClearAll: () => void;
  onSave: () => void;
  onPasteData: () => void;
  saving: boolean;
}

const MetricsActions: React.FC<MetricsActionsProps> = ({
  onAddMetric,
  onClearAll,
  onSave,
  onPasteData,
  saving
}) => {
  return (
    <div className="flex justify-between pt-4">
      <div className="flex gap-2">
        <Button 
          onClick={onAddMetric} 
          variant="outline" 
          className="tnq-button-outline"
        >
          <Plus size={16} className="mr-2" />
          Add Metric
        </Button>
        <Button 
          onClick={onPasteData}
          variant="outline" 
          className="tnq-button-outline"
        >
          <Clipboard size={16} className="mr-2" />
          Paste Data
        </Button>
        <Button 
          onClick={onClearAll}
          variant="outline" 
          className="tnq-button-outline text-red-600 hover:text-red-800"
        >
          <AlertTriangle size={16} className="mr-2" />
          Clear All Data
        </Button>
      </div>
      
      <Button 
        onClick={onSave}
        disabled={saving}
        className="tnq-button"
      >
        <Save size={16} className="mr-2" />
        {saving ? 'Saving...' : 'Save Metrics'}
      </Button>
    </div>
  );
};

export default MetricsActions;
