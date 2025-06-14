import React, { useState, useEffect } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import { saveProductChanges } from '../../services/productEditService';
import MonthYearSelector from '../MonthYearSelector';
import { Card } from '@/components/ui/card';
import { Metric, MetricItem } from '../../lib/types';
import MetricsTable from './MetricsTable';
import MetricsActions from './MetricsActions';
import EmptyMetricsState from './EmptyMetricsState';
import { getCurrentMonthYear } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const ProductEditMetricsSection: React.FC = () => {
  const [saving, setSaving] = useState(false);
  
  const {
    product,
    portfolio,
    metrics, // This now holds an array of Metric (parent) objects
    setMetrics,
    metricsMonth,
    metricsYear,
    handleMetricsMonthYearChange
  } = useProductEdit();

  // State to hold the MetricItems for the currently selected month/year
  const [currentMetricItems, setCurrentMetricItems] = useState<MetricItem[]>([]);

  // Set default month/year to current when component mounts
  useEffect(() => {
    const { month, year } = getCurrentMonthYear();
    handleMetricsMonthYearChange(month, year);
  }, []);

  // Reload metrics from localStorage whenever the component mounts or month/year changes
  useEffect(() => {
    if (product && product.id) {
      console.log('ProductEditMetricsSection: Reloading metrics from localStorage for month/year:', metricsMonth, metricsYear);
      
      try {
        const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
        
        for (const portfolioData of portfolios) {
          const foundProduct = portfolioData.products?.find((p: any) => p.id === product.id);
          if (foundProduct) {
            console.log('ProductEditMetricsSection: Found product with metrics:', foundProduct.metrics?.length || 0);
            
            // Filter metrics for current month/year and get the latest version
            const currentMetricParent = foundProduct.metrics?.filter(
              (m: Metric) => (m.month === metricsMonth && m.year === metricsYear)
            ).sort((a: Metric, b: Metric) => b.version - a.version)[0]; // Get the latest version
            
            if (currentMetricParent) {
              console.log('ProductEditMetricsSection: Found fresh metric items for selected period:', currentMetricParent.metricItems.length);
              setCurrentMetricItems(currentMetricParent.metricItems);
            } else {
              console.log('ProductEditMetricsSection: No fresh metric parent found, initializing empty metric items.');
              setCurrentMetricItems([]);
            }
            break;
          }
        }
      } catch (error) {
        console.error('ProductEditMetricsSection: Error reloading metrics from localStorage:', error);
      }
    }
  }, [product?.id, metricsMonth, metricsYear]);

  const addNewMetric = () => {
    const newMetricItem: MetricItem = {
      id: `metric-item-${Date.now()}`,
      name: '',
      value: 0,
      unit: '',
      monthlyTarget: 0,
      annualTarget: 0,
      status: 'on-track' as const,
      notes: '',
      timestamp: new Date().toISOString(),
      description: '',
      source: '',
      category: '',
      owner: ''
    };
    setCurrentMetricItems([...currentMetricItems, newMetricItem]);
  };

  const updateMetric = (index: number, field: string, value: string | number) => {
    const updatedMetricItems = [...currentMetricItems];
    if (field === 'value' || field === 'monthlyTarget' || field === 'annualTarget') {
      updatedMetricItems[index] = { ...updatedMetricItems[index], [field]: typeof value === 'string' ? parseFloat(value) || 0 : value };
    } else {
      updatedMetricItems[index] = { ...updatedMetricItems[index], [field]: value };
    }
    setCurrentMetricItems(updatedMetricItems);
  };

  const removeMetric = (index: number) => {
    const updatedMetricItems = currentMetricItems.filter((_, i) => i !== index);
    setCurrentMetricItems(updatedMetricItems);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all metrics data? This action cannot be undone.')) {
      setCurrentMetricItems([]);
    }
  };

  const handlePasteData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split('\n').filter(row => row.trim());
      const pasteData = rows.map(row => row.split('\t'));
      
      const newMetricItems = pasteData.map((row, index) => ({
        id: `metric-item-paste-${Date.now()}-${index}`,
        name: row[0] || '',
        value: parseFloat(row[1]) || 0,
        unit: row[2] || '',
        monthlyTarget: row[3] ? parseFloat(row[3]) : undefined,
        annualTarget: row[4] ? parseFloat(row[4]) : undefined,
        status: (row[5] || 'on-track') as 'on-track' | 'at-risk' | 'off-track',
        notes: row[6] || '',
        timestamp: new Date().toISOString(),
        description: '',
        source: '',
        category: '',
        owner: ''
      })).filter(metricItem => metricItem.name.trim() !== '');
      
      setCurrentMetricItems([...currentMetricItems, ...newMetricItems]);
    } catch (error) {
      console.error('Failed to paste data:', error);
    }
  };

  const handleSave = async () => {
    if (!product || !portfolio) {
      toast({
        title: "Error",
        description: "Missing product or portfolio data",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    console.log('ProductEditMetricsSection: Saving metrics for month/year:', metricsMonth, metricsYear);
    console.log('ProductEditMetricsSection: Current metric items to save:', currentMetricItems);
    
    try {
      // Filter out empty metric items and ensure proper data types
      const validMetricItems = currentMetricItems
        .filter(item => item.name.trim() !== '')
        .map(item => ({
          ...item,
          value: typeof item.value === 'string' ? parseFloat(item.value) || 0 : item.value,
          monthlyTarget: typeof item.monthlyTarget === 'string' ? parseFloat(item.monthlyTarget) || 0 : item.monthlyTarget,
          annualTarget: typeof item.annualTarget === 'string' ? parseFloat(item.annualTarget) || 0 : item.annualTarget,
          timestamp: new Date().toISOString() // Ensure timestamp is updated on save
        }));
      
      // Create a single Metric (parent) object
      const newMetric: Metric = {
        id: `metric-${metricsMonth}-${metricsYear}-${Date.now()}`,
        month: metricsMonth,
        year: metricsYear,
        createdAt: new Date().toISOString(),
        version: 1, // Version will be handled by saveProductChanges
        metricItems: validMetricItems
      };

      console.log('ProductEditMetricsSection: Metric object to save:', newMetric);
      
      // Use the saveProductChanges service to save metrics
      const success = await saveProductChanges(product.id, {
        metrics: [newMetric] // Pass the single Metric object in an array
      });
      
      if (success) {
        console.log('ProductEditMetricsSection: Metrics saved successfully');
        toast({
          title: "Success",
          description: "Metrics saved successfully",
        });
      } else {
        console.error('ProductEditMetricsSection: Failed to save metrics');
        toast({
          title: "Error",
          description: "Failed to save metrics. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('ProductEditMetricsSection: Error saving metrics:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6 font-['Pathway_Extreme']">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-tnq-blue tnq-font">Product Metrics</h2>
        <MonthYearSelector
          selectedMonth={metricsMonth}
          selectedYear={metricsYear}
          onChange={handleMetricsMonthYearChange}
          className="compact tnq-font"
        />
      </div>
      
      <Card className="p-6">
        {currentMetricItems.length === 0 ? (
          <EmptyMetricsState 
            onAddMetric={addNewMetric} 
            onPasteData={handlePasteData}
          />
        ) : (
          <div className="space-y-4">
            <MetricsTable
              metrics={currentMetricItems} // Pass MetricItems directly
              onUpdateMetric={updateMetric}
              onRemoveMetric={removeMetric}
            />
            
            <MetricsActions
              onAddMetric={addNewMetric}
              onClearAll={handleClearAll}
              onSave={handleSave}
              onPasteData={handlePasteData}
              saving={saving}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductEditMetricsSection;
