import React, { useState } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import { saveProductChanges } from '../../services/productEditService';
import DataImportGrid from '../DataImportGrid';
import MonthYearSelector from '../MonthYearSelector';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { usePermissions } from '../../contexts/AuthContext';
import { ReleasePlanItem } from '../../lib/types';
import { toast } from '@/hooks/use-toast';

const PlanEditSection: React.FC = () => {
  const { canDelete } = usePermissions();
  const [saving, setSaving] = useState(false);

  const {
    product,
    portfolio,
    planItems,
    setPlanItems,
    planMonth,
    planYear,
    handlePlanMonthYearChange
  } = useProductEdit();

  const validCategories = ["Enhancement", "Bug", "Improvement", "Clarification", "Training"] as const;
  const validPriorities = ["High", "Medium", "Low"] as const;
  const validSources = ["Internal", "Customer", "Market", "Regulatory", "Other"] as const;
  
  const headers = ["Title", "Description", "Category", "Priority", "Source", "Owner", "Status"];
  
  const planItemsToGridData = (items: ReleasePlanItem[]): string[][] => {
    return items.map(item => [
      item.title,
      item.description,
      item.category || "Enhancement",
      item.priority || "Medium",
      item.source || "Internal",
      item.owner || "",
      item.status.charAt(0).toUpperCase() + item.status.slice(1),
    ]);
  };
  
  const handleSavePlan = (data: string[][]) => {
    const updatedItems: ReleasePlanItem[] = data.map((row, index) => {
      const existingItem = index < planItems.length ? planItems[index] : null;
      let status = row[6].toLowerCase();
      
      if (status === "in-progress" || status === "in progress") {
        status = "in-progress";
      } else if (!["planned", "in-progress", "completed", "delayed"].includes(status)) {
        status = "planned";
      }
      
      const category = validCategories.includes(row[2] as any) ? row[2] as any : "Enhancement";
      const priority = validPriorities.includes(row[3] as any) ? row[3] as any : "Medium";
      const source = validSources.includes(row[4] as any) ? row[4] as any : "Internal";
      
      return {
        id: existingItem?.id || `plan-item-new-${index}-${Date.now()}`,
        title: row[0] || "Untitled Item",
        description: row[1] || "",
        category,
        priority,
        targetDate: existingItem?.targetDate || new Date().toISOString(),
        source,
        owner: row[5] || "",
        status: status as "planned" | "in-progress" | "completed" | "delayed"
      };
    }).filter(item => item.title.trim() !== '');
    
    setPlanItems(updatedItems);
  };

  const handleSave = async () => {
    if (!product) {
      toast({
        title: "Error",
        description: "Product data is missing",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      // Create a single ReleasePlan with combined info from all items
      const mainItem = planItems[0];
      const combinedTitle = planItems.map(item => item.title).join('; ');
      const combinedDescription = planItems.map(item => item.description).join('; ');
      
      const releasePlans = [{
        id: `plan-${planMonth}-${planYear}-${Date.now()}`,
        month: planMonth,
        year: planYear,
        title: combinedTitle || 'No plans defined',
        description: combinedDescription || 'No description available',
        targetDate: mainItem?.targetDate || new Date().toISOString(),
        status: (mainItem?.status || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed',
        createdAt: new Date().toISOString(),
        version: 1,
        items: planItems.filter(item => item.title.trim() !== '')
      }];

      const success = await saveProductChanges(product.id, {
        releasePlans
      });

      if (success) {
        toast({
          title: "Success",
          description: "Release plan saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save release plan",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving plan:', error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Release Plan</h2>
        <MonthYearSelector
          selectedMonth={planMonth}
          selectedYear={planYear}
          onChange={handlePlanMonthYearChange}
          className="compact"
        />
      </div>
      
      <DataImportGrid
        title=""
        description=""
        headers={headers}
        initialData={planItemsToGridData(planItems)}
        onSave={handleSavePlan}
        allowDelete={canDelete}
        allowAdd={canDelete}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Plan'}</span>
        </Button>
      </div>
    </div>
  );
};

export default PlanEditSection;