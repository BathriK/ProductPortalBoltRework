import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { saveProductChanges } from '../services/productEditService';

interface AddRoadmapFormProps {
  productId: string;
  onRoadmapAdded: () => void;
  selectedYear: number;
}

const AddRoadmapForm: React.FC<AddRoadmapFormProps> = ({ productId, onRoadmapAdded, selectedYear }) => {
  const [roadmapLink, setRoadmapLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roadmapLink || !roadmapLink.trim()) {
      toast({ 
        title: "Error",
        description: "Please enter a link to the roadmap",
        variant: "destructive" 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare new roadmap entries for each quarter
      const now = new Date().toISOString();
      
      // Create new roadmap entries with the Google Sheets link
      const newRoadmapEntries = [1, 2, 3, 4].map(quarter => ({
        id: `roadmap-${Date.now()}-${quarter}`,
        year: selectedYear,
        quarter: quarter as 1 | 2 | 3 | 4,
        title: `Q${quarter} Roadmap Item`,
        description: `Q${quarter} roadmap item from Google Sheets`,
        status: "planned" as const,
        createdAt: now,
        version: "1.0",
        link: roadmapLink.trim()
      }));
      
      // Save the roadmap entries using the service
      const success = await saveProductChanges(productId, {
        roadmap: newRoadmapEntries
      });
      
      if (success) {
        toast({
          title: "Success",
          description: "Roadmap link added successfully",
        });
        
        // Reset form and notify parent component
        setRoadmapLink('');
        onRoadmapAdded();
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
        description: "Failed to add roadmap",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Google Sheet Link
        </label>
        <Input
          type="url"
          value={roadmapLink}
          onChange={(e) => setRoadmapLink(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter the link to the Google Sheet containing the roadmap information
        </p>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Roadmap'}
        </Button>
      </div>
    </form>
  );
};

export default AddRoadmapForm;