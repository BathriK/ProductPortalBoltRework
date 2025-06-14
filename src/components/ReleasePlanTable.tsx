import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReleasePlan } from "@/lib/types";

interface ReleasePlanTableProps {
  plans: ReleasePlan[];
}

const ReleasePlanTable: React.FC<ReleasePlanTableProps> = ({ plans }) => {
  if (!plans || plans.length === 0) {
    return <p className="text-gray-500 italic">No plans defined</p>;
  }

  const plan = plans[0]; // Show the first plan's items

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-blue-600 font-semibold">Title</TableHead>
            <TableHead className="text-blue-600 font-semibold">Description</TableHead>
            <TableHead className="text-blue-600 font-semibold">Category</TableHead>
            <TableHead className="text-blue-600 font-semibold">Priority</TableHead>
            <TableHead className="text-blue-600 font-semibold">Source</TableHead>
            <TableHead className="text-blue-600 font-semibold">Owner</TableHead>
            <TableHead className="text-blue-600 font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plan.items && plan.items.length > 0 ? (
            plan.items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="py-3 text-gray-900">{item.title}</TableCell>
                <TableCell className="py-3 text-gray-900">{item.description}</TableCell>
                <TableCell className="py-3 text-gray-900">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    item.category === "Enhancement" ? "bg-green-100 text-green-800" :
                    item.category === "Bug" ? "bg-red-100 text-red-800" :
                    item.category === "Improvement" ? "bg-yellow-100 text-yellow-800" :
                    item.category === "Clarification" ? "bg-blue-100 text-blue-800" :
                    item.category === "Training" ? "bg-orange-100 text-orange-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {item.category || 'Enhancement'}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-gray-900">{item.priority || 'Medium'}</TableCell>
                <TableCell className="py-3 text-gray-900">{item.source || 'Internal'}</TableCell>
                <TableCell className="py-3 text-gray-900">{item.owner || 'N/A'}</TableCell>
                <TableCell className="py-3 text-gray-900">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === "completed" ? "bg-green-100 text-green-800" :
                    item.status === "in-progress" ? "bg-yellow-100 text-yellow-800" :
                    item.status === "delayed" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                No plan items available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReleasePlanTable;