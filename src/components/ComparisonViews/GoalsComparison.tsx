import React from 'react';
import { GoalItem } from '../../lib/types';
import { findChanges } from '../../lib/comparisonUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Plus, Minus, Edit } from 'lucide-react';

interface GoalsComparisonProps {
  currentGoals: GoalItem[];
  previousGoals: GoalItem[];
  currentPeriod: string;
  previousPeriod: string;
}

const GoalsComparison: React.FC<GoalsComparisonProps> = ({
  currentGoals,
  previousGoals,
  currentPeriod,
  previousPeriod
}) => {
  const { added, removed, modified } = findChanges(
    currentGoals,
    previousGoals,
    ['description', 'currentState', 'targetState']
  );

  const unchanged = currentGoals.filter(goal => {
    const prevGoal = previousGoals.find(p => p.id === goal.id);
    return prevGoal && !modified.includes(goal);
  });

  const getChangeIcon = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Period */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-tnq-navy">{currentPeriod}</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal Description</TableHead>
                  <TableHead>Current State</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentGoals.map((goal) => {
                  let changeType: 'added' | 'modified' | null = null;
                  if (added.includes(goal)) changeType = 'added';
                  else if (modified.includes(goal)) changeType = 'modified';

                  return (
                    <TableRow key={goal.id} className={changeType === 'added' ? 'bg-green-50' : changeType === 'modified' ? 'bg-blue-50' : ''}>
                      <TableCell>{goal.description}</TableCell>
                      <TableCell>{goal.currentState}</TableCell>
                      <TableCell>{goal.targetState}</TableCell>
                      <TableCell>
                        {changeType && getChangeIcon(changeType)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Previous Period */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-600">{previousPeriod}</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal Description</TableHead>
                  <TableHead>Current State</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previousGoals.map((goal) => {
                  const isRemoved = removed.includes(goal);
                  const isModified = modified.find(m => m.id === goal.id);

                  return (
                    <TableRow key={goal.id} className={isRemoved ? 'bg-red-50' : isModified ? 'bg-blue-50' : ''}>
                      <TableCell>{goal.description}</TableCell>
                      <TableCell>{goal.currentState}</TableCell>
                      <TableCell>{goal.targetState}</TableCell>
                      <TableCell>
                        {isRemoved && getChangeIcon('removed')}
                        {isModified && getChangeIcon('modified')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Comparison Summary</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          {added.length > 0 && (
            <Badge variant="outline\" className="text-green-700 border-green-300">
              <Plus className="h-3 w-3 mr-1" />
              {added.length} Added
            </Badge>
          )}
          {removed.length > 0 && (
            <Badge variant="outline" className="text-red-700 border-red-300">
              <Minus className="h-3 w-3 mr-1" />
              {removed.length} Removed
            </Badge>
          )}
          {modified.length > 0 && (
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              <Edit className="h-3 w-3 mr-1" />
              {modified.length} Modified
            </Badge>
          )}
          {unchanged.length > 0 && (
            <Badge variant="outline" className="text-gray-700 border-gray-300">
              {unchanged.length} Unchanged
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalsComparison;