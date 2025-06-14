import React, { useState, useEffect } from "react";
import { useProductEdit } from "../../contexts/ProductEditContext";
import AddRoadmapForm from "../AddRoadmapForm";
import RoadmapTable from "../RoadmapTable";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { getCurrentMonthYear } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { saveProductChanges } from "../../services/productEditService";

interface RoadmapEditSectionProps {
  productId: string;
  isEditing?: boolean;
}

const RoadmapEditSection: React.FC<RoadmapEditSectionProps> = ({ productId, isEditing = true }) => {
  const { product, selectedYear, setSelectedYear } = useProductEdit();
  const [isAddingRoadmap, setIsAddingRoadmap] = useState(false);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Set default year to current year when component mounts
  useEffect(() => {
    const { year } = getCurrentMonthYear();
    setSelectedYear(year);
  }, []);

  // Update roadmaps when product or selectedYear changes
  useEffect(() => {
    if (product && product.roadmap) {
      // Filter roadmaps by selected year
      const yearRoadmaps = product.roadmap.filter((r: any) => r.year === selectedYear);
      setRoadmaps(yearRoadmaps);
    }
  }, [product, selectedYear]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleRoadmapAdded = async (roadmapLink: string) => {
    if (!product) {
      toast({
        title: "Error",
        description: "Product data is missing",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create new roadmap entries for each quarter
      const now = new Date().toISOString();
      
      // Find existing roadmap versions for this year to calculate the new version
      const existingRoadmaps = product.roadmap.filter(r => r.year === selectedYear);
      const newVersionNumber = existingRoadmaps.length > 0 
        ? Math.max(...existingRoadmaps.map(r => parseFloat(r.version))) + 0.1 
        : 1.0;
      
      const newRoadmapEntries = [1, 2, 3, 4].map(quarter => ({
        id: `roadmap-${Date.now()}-${quarter}`,
        year: selectedYear,
        quarter: quarter as 1 | 2 | 3 | 4,
        title: `Q${quarter} Roadmap Item`,
        description: `Q${quarter} roadmap item from Google Sheets`,
        status: "planned" as const,
        createdAt: now,
        version: newVersionNumber.toString(),
        link: roadmapLink.trim()
      }));
      
      // Save the roadmap entries using the service
      const success = await saveProductChanges(productId, {
        roadmap: newRoadmapEntries
      });
      
      if (success) {
        toast({
          title: "Success",
          description: "Roadmap added successfully",
        });
        setIsAddingRoadmap(false);
        
        // Update local state with new roadmap entries
        setRoadmaps(prev => [...newRoadmapEntries, ...prev]);
      } else {
        toast({
          title: "Error",
          description: "Failed to add roadmap",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding roadmap:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-tnq-blue">Roadmap</h2>
        <div className="flex items-center gap-4">
          <select 
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="px-3 py-1.5 border rounded-md text-sm"
            disabled={!isEditing}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {isEditing && !isAddingRoadmap && (
            <Button onClick={() => setIsAddingRoadmap(true)}>
              Add Roadmap
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        {isAddingRoadmap && isEditing ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Add New Roadmap</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Sheet Link
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-tnq-blue focus:border-transparent"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  id="roadmap-link"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the link to the Google Sheet containing the roadmap information
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingRoadmap(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    const linkInput = document.getElementById('roadmap-link') as HTMLInputElement;
                    if (linkInput && linkInput.value) {
                      handleRoadmapAdded(linkInput.value);
                    } else {
                      toast({
                        title: "Error",
                        description: "Please enter a roadmap link",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? 'Adding...' : 'Add Roadmap'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <RoadmapTable roadmaps={roadmaps} productId={productId} />
        )}
      </Card>
    </div>
  );
};

export default RoadmapEditSection;