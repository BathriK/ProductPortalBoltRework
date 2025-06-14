
import React, { useState, useEffect } from "react";
import { useProductEdit } from "../../contexts/ProductEditContext";
import AddRoadmapForm from "../AddRoadmapForm";
import RoadmapTable from "../RoadmapTable";
import { Button } from "../ui/button";

interface RoadmapTabProps {
  productId: string;
}

const RoadmapTab: React.FC<RoadmapTabProps> = ({ productId }) => {
  const { product } = useProductEdit();
  const [isAddingRoadmap, setIsAddingRoadmap] = useState(false);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  useEffect(() => {
    if (product && product.roadmap) {
      // Filter roadmaps by selected year
      const yearRoadmaps = product.roadmap.filter((r: any) => r.year === selectedYear);
      setRoadmaps(yearRoadmaps);
    }
  }, [product, selectedYear]);

  const handleAddRoadmap = () => {
    setIsAddingRoadmap(true);
  };

  const handleCancelAdd = () => {
    setIsAddingRoadmap(false);
  };

  const handleRoadmapAdded = () => {
    setIsAddingRoadmap(false);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-tnq-purple">Roadmap</h2>
        <div className="flex items-center gap-4">
          <select 
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {!isAddingRoadmap && (
            <Button onClick={handleAddRoadmap}>
              Add Roadmap
            </Button>
          )}
        </div>
      </div>

      {isAddingRoadmap ? (
        <AddRoadmapForm 
          productId={productId} 
          onRoadmapAdded={handleRoadmapAdded} 
          selectedYear={selectedYear}
        />
      ) : (
        <RoadmapTable roadmaps={roadmaps} productId={productId} />
      )}
    </div>
  );
};

export default RoadmapTab;
