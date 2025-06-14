import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ReleaseGoal, GoalItem } from "@/lib/types";

interface GoalsTableProps {
  goals: ReleaseGoal[] | GoalItem[];
}

const GoalsTable: React.FC<GoalsTableProps> = ({ goals }) => {
  if (!goals || goals.length === 0) {
    return <p className="text-gray-500 italic">No goals defined</p>;
  }

  // Handle both ReleaseGoal[] and GoalItem[] formats
  const goalItems: GoalItem[] = goals.map(goal => {
    // If it's a ReleaseGoal with nested goals, extract the first goal item
    if ('goals' in goal && goal.goals && goal.goals.length > 0) {
      return goal.goals[0];
    }
    // If it's a ReleaseGoal with individual properties, convert to GoalItem format
    if ('description' in goal && 'currentState' in goal && 'targetState' in goal) {
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
    }
    // If it's already a GoalItem, return as is
    return goal as GoalItem;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3 text-blue-600 font-semibold bg-tnqblue">Goal Description</TableHead>
            <TableHead className="w-1/3 text-blue-600 font-semibold bg-blue-950">Current State</TableHead>
            <TableHead className="w-1/3 text-blue-600 font-semibold bg-blue-950">Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goalItems.map(goal => (
            <TableRow key={goal.id}>
              <TableCell className="py-3 text-gray-900">{goal.description}</TableCell>
              <TableCell className="py-3 text-gray-900">{goal.currentState}</TableCell>
              <TableCell className="py-3 text-gray-900">{goal.targetState}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GoalsTable;