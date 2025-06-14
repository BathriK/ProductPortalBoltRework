
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import RoadmapTab from "./RoadmapTab";
import GoalsTab from "./GoalsTab";
import PlanTab from "./PlanTab";
import MetricsTab from "./MetricsTab";
import NotesTab from "./NotesTab";

interface ProductEditTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  productId: string;
  onSave: () => void;
}

const ProductEditTabs: React.FC<ProductEditTabsProps> = ({ 
  activeTab, 
  setActiveTab, 
  productId,
  onSave
}) => {
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="w-full"
    >
      <div className="flex justify-center mb-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm inline-flex gap-2">
          <TabsTrigger 
            value="roadmap"
            className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px]"
          >
            Roadmap
          </TabsTrigger>
          <TabsTrigger 
            value="goals"
            className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px]"
          >
            Release Goals
          </TabsTrigger>
          <TabsTrigger 
            value="plan"
            className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px]"
          >
            Release Plans
          </TabsTrigger>
          <TabsTrigger 
            value="metrics"
            className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px]"
          >
            Product Metrics
          </TabsTrigger>
          <TabsTrigger 
            value="notes"
            className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px]"
          >
            Release Notes
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="p-4 md:p-6">
        <TabsContent value="roadmap" className="m-0 p-0">
          <RoadmapTab productId={productId} />
        </TabsContent>
        
        <TabsContent value="goals" className="m-0 p-0">
          <GoalsTab />
        </TabsContent>
        
        <TabsContent value="plan" className="m-0 p-0">
          <PlanTab />
        </TabsContent>
        
        <TabsContent value="metrics" className="m-0 p-0">
          <MetricsTab />
        </TabsContent>
        
        <TabsContent value="notes" className="m-0 p-0">
          <NotesTab productId={productId} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ProductEditTabs;
