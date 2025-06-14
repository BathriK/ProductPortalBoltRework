
import React from 'react';
import ReleaseNotesTable from '../ReleaseNotesTable';
import MonthYearSelector from '../MonthYearSelector';
import { ReleaseNote } from '../../lib/types';

export interface NotesTabContentProps {
  selectedMonth: number;
  selectedYear: number;
  releaseNotes: ReleaseNote[];
  productId: string;
  onMonthYearChange: (month: number, year: number) => void;
  isEditMode?: boolean;
}

const NotesTabContent: React.FC<NotesTabContentProps> = ({
  selectedMonth,
  selectedYear,
  releaseNotes,
  productId,
  onMonthYearChange,
  isEditMode = false
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-blue-600">Release Notes</h2>
        
        <div className="flex items-center space-x-4">
          <MonthYearSelector 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={onMonthYearChange} 
            className="compact" 
          />
        </div>
      </div>
      
      {releaseNotes && releaseNotes.length > 0 ? (
        <ReleaseNotesTable 
          releaseNotes={releaseNotes} 
          productId={productId} 
          showAddButton={isEditMode} 
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No release notes available for this product.</p>
        </div>
      )}
    </div>
  );
};

export default NotesTabContent;
