import React, { useState, useEffect } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import ReleaseNotesTable from '../ReleaseNotesTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import MonthYearSelector from '../MonthYearSelector';
import { saveProductChanges } from '../../services/productEditService';
import { getPreviousMonthYear } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProductEditNotesSectionProps {
  productId: string;
}

const ProductEditNotesSection: React.FC<ProductEditNotesSectionProps> = ({ productId }) => {
  const { 
    product, 
    portfolio,
    noteMonth, 
    noteYear, 
    setNoteMonth, 
    setNoteYear,
    noteLink,
    setNoteLink
  } = useProductEdit();
  
  const [isSaving, setIsSaving] = useState(false);

  // Set default month/year to previous month when component mounts
  useEffect(() => {
    const { month, year } = getPreviousMonthYear();
    setNoteMonth(month);
    setNoteYear(year);
  }, []);

  const existingReleaseNotes = product?.releaseNotes || [];
  
  // Filter release notes to show only the selected month/year
  const filteredReleaseNotes = existingReleaseNotes.filter(
    note => note.month === noteMonth && note.year === noteYear
  );
  
  const hasReleaseNotesForCurrentPeriod = filteredReleaseNotes.length > 0;

  const handleAddReleaseNotes = async () => {
    if (!noteLink.trim()) {
      toast({
        title: "Error",
        description: "Please provide a release notes link",
        variant: "destructive"
      });
      return;
    }
    
    if (!product) {
      toast({
        title: "Error",
        description: "Product data not available",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('Saving release notes with params:', {
        productId,
        noteLink: noteLink.trim(),
        noteMonth,
        noteYear
      });

      const newReleaseNote = {
        id: `note-${Date.now()}`,
        month: noteMonth,
        year: noteYear,
        highlights: '',
        title: `Release Notes ${noteMonth}/${noteYear}`,
        description: 'Release notes for this period',
        type: 'other' as const,
        createdAt: new Date().toISOString(),
        version: 1,
        link: noteLink.trim()
      };

      const success = await saveProductChanges(productId, {
        releaseNotes: [newReleaseNote]
      });
      
      if (success) {
        console.log('Release notes saved successfully');
        toast({
          title: "Success",
          description: "Release notes saved successfully",
        });
        
        // Reset form
        setNoteLink('');
      } else {
        console.error('Failed to save release notes');
        toast({
          title: "Error",
          description: "Failed to save release notes. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving release notes:', error);
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
    <div className="space-y-6 font-['Pathway_Extreme']">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-tnq-blue">Release Notes</h2>
        <MonthYearSelector
          selectedMonth={noteMonth}
          selectedYear={noteYear}
          onChange={(month, year) => {
            setNoteMonth(month);
            setNoteYear(year);
          }}
          className="compact tnq-font"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900 tnq-font">
          Release Notes for {noteMonth}/{noteYear}
        </h3>
        {hasReleaseNotesForCurrentPeriod ? (
          <ReleaseNotesTable 
            releaseNotes={filteredReleaseNotes} 
            productId={productId} 
            showAddButton={false}
          />
        ) : (
          <div className="text-center py-4 text-gray-500 tnq-font">
            No release notes available for {noteMonth}/{noteYear}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-900 tnq-font">Add New Release Notes</h3>
        <div className="space-y-6">
          <div>
            <Label htmlFor="notes-link" className="text-gray-900 tnq-font">Release Notes Link</Label>
            <Input
              id="notes-link"
              type="url"
              value={noteLink}
              onChange={(e) => setNoteLink(e.target.value)}
              placeholder="https://..."
              className="text-gray-900 tnq-font"
            />
          </div>

          <Button 
            onClick={handleAddReleaseNotes}
            disabled={!noteLink.trim() || isSaving}
            className="tnq-button"
          >
            {isSaving ? 'Saving...' : 'Add Release Notes'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProductEditNotesSection;