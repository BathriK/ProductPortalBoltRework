
import { getMonthName } from './utils';

export interface ComparisonPeriod {
  month: number;
  year: number;
  label: string;
}

export const getPreviousMonth = (month: number, year: number): ComparisonPeriod => {
  let prevMonth = month - 1;
  let prevYear = year;
  
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  
  return {
    month: prevMonth,
    year: prevYear,
    label: `${getMonthName(prevMonth)} ${prevYear}`
  };
};

export const getCurrentPeriodLabel = (month: number, year: number): string => {
  return `${getMonthName(month)} ${year}`;
};

export const findChanges = <T extends { id: string }>(
  current: T[] = [],
  previous: T[] = [],
  compareFields: (keyof T)[] = []
) => {
  // Add null checks to prevent runtime errors
  const currentArray = current || [];
  const previousArray = previous || [];
  
  const currentIds = currentArray.map(item => item.id);
  const previousIds = previousArray.map(item => item.id);
  
  // New items in current period
  const added = currentArray.filter(item => !previousIds.includes(item.id));
  
  // Items removed from previous period
  const removed = previousArray.filter(item => !currentIds.includes(item.id));
  
  // Items that exist in both but may have changed
  const modified = currentArray.filter(item => {
    const previousItem = previousArray.find(prev => prev.id === item.id);
    if (!previousItem) return false;
    
    // If no specific fields to compare, assume no changes for existing items
    if (compareFields.length === 0) return false;
    
    // Check if any of the specified fields have changed
    return compareFields.some(field => item[field] !== previousItem[field]);
  });
  
  return { added, removed, modified };
};

export const calculateMetricChange = (current: number, previous: number): {
  change: number;
  percentage: number;
  direction: 'up' | 'down' | 'same';
} => {
  const change = current - previous;
  const percentage = previous !== 0 ? (change / previous) * 100 : 0;
  
  let direction: 'up' | 'down' | 'same' = 'same';
  if (change > 0) direction = 'up';
  else if (change < 0) direction = 'down';
  
  return { change, percentage, direction };
};
