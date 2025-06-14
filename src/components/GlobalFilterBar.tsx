
import React from 'react';
import ProductFilter from './ProductFilter';
import MonthYearSelector from './MonthYearSelector';

interface GlobalFilterBarProps {
  selectedProductId?: string;
  onProductChange?: (productId: string) => void;
  selectedMonth?: number;
  selectedYear?: number;
  onDateChange?: (month: number, year: number) => void;
  showDateFilter?: boolean;
}

const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  selectedProductId,
  onProductChange,
  selectedMonth,
  selectedYear,
  onDateChange,
  showDateFilter = true
}) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-4 bg-white p-3 rounded-md shadow-sm mb-4">
      {showDateFilter && selectedMonth && selectedYear && onDateChange && (
        <MonthYearSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChange={onDateChange}
          className="min-w-[180px]"
        />
      )}
      <ProductFilter
        selectedProductId={selectedProductId}
        onProductChange={onProductChange}
        variant="minimal"
        className="min-w-[180px]"
      />
    </div>
  );
};

export default GlobalFilterBar;
