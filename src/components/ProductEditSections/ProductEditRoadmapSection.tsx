import React, { useState, useEffect } from "react";
import { useProductEdit } from "../../contexts/ProductEditContext";
import AddRoadmapForm from "../AddRoadmapForm";
import RoadmapTable from "../RoadmapTable";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { getCurrentMonthYear } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ProductEditRoadmapSectionProps {
  productId: string;
  isEditing: boolean;
}

const ProductEditRoadmapSection: React.FC<ProductEditRoadmapSectionProps> = ({ productId, isEditing }) => {
  const { product, selectedYear, setSelectedYear } = useProductEdit();
  const [isAddingRoadmap, setIsAddingRoadmap] = useState(false);

  // Set default year to current year when component mounts
  useEffect(() => {
    const { year } = getCurrentMonthYear();
    setSelectedYear(year);
  }, []);

  const roadmaps = product?.roadmap?.filter((r: any) => r.year === selectedYear) || [];

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleRoadmapAdded = () => {
    setIsAddingRoadmap(false);
    toast({
      title: "Success",
      description: "Roadmap added successfully",
    });
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
          <AddRoadmapForm 
            productId={productId} 
            onRoadmapAdded={handleRoadmapAdded} 
            selectedYear={selectedYear}
          />
        ) : (
          <RoadmapTable roadmaps={roadmaps} productId={productId} />
        )}
      </Card>
    </div>
  );
};

export default ProductEditRoadmapSection;