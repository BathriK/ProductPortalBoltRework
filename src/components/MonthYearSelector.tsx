import React from 'react';
import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface MonthYearSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onChange: (month: number, year: number) => void;
  className?: string;
  disabled?: boolean;
  yearOnly?: boolean; // Used for roadmap section that only needs year
}
const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onChange,
  className = '',
  disabled = false,
  yearOnly = false
}) => {
  // Generate year options (2025-2026)
  const generateYearOptions = () => {
    return [{
      value: "2025",
      label: "2025"
    }, {
      value: "2026",
      label: "2026"
    }];
  };

  // Generate options for April 2025 to March 2026 only
  const generateMonthOptions = () => {
    const options = [];
    const startYear = 2025;
    const endYear = 2026;
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        // Only include April 2025 - March 2026
        if (year === startYear && month < 4 || year === endYear && month > 3) {
          continue;
        }
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        options.push({
          value: `${month}-${year}`,
          label: `${monthNames[month - 1]} ${year}`
        });
      }
    }
    return options;
  };

  // Use appropriate options based on yearOnly flag
  const options = yearOnly ? generateYearOptions() : generateMonthOptions();

  // Find the selected value
  const selectedValue = yearOnly ? `${selectedYear}` : `${selectedMonth}-${selectedYear}`;

  // Handle selection change
  const handleChange = (value: string) => {
    if (yearOnly) {
      // Only the year changes
      onChange(selectedMonth, parseInt(value));
    } else {
      // Both month and year change
      const [month, year] = value.split('-').map(Number);
      onChange(month, year);
    }
  };

  // Determine if we should use the compact style
  const isCompact = className?.includes('compact');
  return <div className={`flex items-center ${isCompact ? 'space-x-1' : 'space-x-2'} ${className}`}>
      
      <Select value={selectedValue} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className={`${isCompact ? 'w-[160px] h-8 text-xs px-2' : 'w-[200px]'}`}>
          <SelectValue placeholder={yearOnly ? "Select year" : "Select period"} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>)}
        </SelectContent>
      </Select>
    </div>;
};
export default MonthYearSelector;