import React from 'react';
import { Link } from 'react-router-dom';
import { ReleaseGoal, GoalItem } from '../lib/types';
import { getMonthName, getLatestVersionedItem } from '../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ReleaseGoalsCardProps {
  productId: string;
  latestReleaseGoal: ReleaseGoal | undefined;
}

const ReleaseGoalsCard: React.FC<ReleaseGoalsCardProps> = ({ productId, latestReleaseGoal }) => {
  // Format month and year
  const getMonthYear = (month: number, year: number) => {
    return `${getMonthName(month)} ${year}`;
  };

  // Get the goal data to display - either from nested goals or individual properties
  const getGoalData = (goal: ReleaseGoal): GoalItem => {
    if (goal.goals && goal.goals.length > 0) {
      return goal.goals[0]; // Show first goal from nested structure
    }
    // Use individual properties
    return {
      id: goal.id,
      description: goal.description,
      currentState: goal.currentState,
      targetState: goal.targetState,
      status: goal.status,
      owner: goal.owner,
      priority: goal.priority,
      category: goal.category
    };
  };

  // Get all goals to display (up to 5)
  const getGoalsToDisplay = (goal: ReleaseGoal): GoalItem[] => {
    if (goal.goals && goal.goals.length > 0) {
      return goal.goals.slice(0, 5); // Show up to 5 goals
    }
    // Use individual properties
    return [{
      id: goal.id,
      description: goal.description,
      currentState: goal.currentState,
      targetState: goal.targetState,
      status: goal.status,
      owner: goal.owner,
      priority: goal.priority,
      category: goal.category
    }];
  };

  // Check if there are more goals to show
  const hasMoreGoals = (goal: ReleaseGoal): boolean => {
    return goal.goals && goal.goals.length > 5;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-700">Release Goals</h4>
        <Link 
          to={`/products/${productId}`}
          state={{ activeTab: "goals" }}
          className="text-xs text-tnq-blue hover:text-tnq-navyBlue hover:underline"
        >
          View All
        </Link>
      </div>
      
      {latestReleaseGoal ? (
        <div className="bg-gray-50 p-3 rounded-md h-full border border-[#D9E2EC]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-sm">
              {getMonthYear(latestReleaseGoal.month, latestReleaseGoal.year)}
            </span>
            <span className="text-xs text-white bg-tnq-blue px-2 py-0.5 rounded-full">
              v{latestReleaseGoal.version || '1.0'}
            </span>
          </div>
          
          <div className="rounded-md border border-[#D9E2EC] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-1 px-2 text-xs">Goal Description</TableHead>
                  <TableHead className="py-1 px-2 text-xs">Current State</TableHead>
                  <TableHead className="py-1 px-2 text-xs">Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getGoalsToDisplay(latestReleaseGoal).map(goal => (
                  <TableRow key={goal.id}>
                    <TableCell className="py-1 px-2 text-xs">{goal.description}</TableCell>
                    <TableCell className="py-1 px-2 text-xs">{goal.currentState}</TableCell>
                    <TableCell className="py-1 px-2 text-xs">{goal.targetState}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-2 text-right">
            {hasMoreGoals(latestReleaseGoal) && (
              <Link
                to={`/products/${productId}`}
                state={{ activeTab: "goals" }}
                className="text-xs text-tnq-blue hover:text-tnq-navyBlue hover:underline"
              >
                View {latestReleaseGoal.goals?.length - 5} more goals
              </Link>
            )}
            {!hasMoreGoals(latestReleaseGoal) && (
              <Link
                to={`/products/${productId}`}
                state={{ activeTab: "goals" }}
                className="text-xs text-tnq-blue hover:text-tnq-navyBlue hover:underline"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No release goals defined</p>
      )}
    </div>
  );
};

export default ReleaseGoalsCard;