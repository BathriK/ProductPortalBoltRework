import React from 'react';
import { ReleasePlanItem } from '../../lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Plus, Minus, Edit } from 'lucide-react';

interface PlanComparisonProps {
  currentPlan: ReleasePlanItem[];
  previousPlan: ReleasePlanItem[];
  currentPeriod: string;
  previousPeriod: string;
}

const PlanComparison: React.FC<PlanComparisonProps> = ({
  currentPlan,
  previousPlan,
  currentPeriod,
  previousPeriod
}) => {
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Enhancement': return 'bg-green-100 text-green-800';
      case 'Bug': return 'bg-red-100 text-red-800';
      case 'Improvement': return 'bg-yellow-100 text-yellow-800';
      case 'Clarification': return 'bg-blue-100 text-blue-800';
      case 'Training': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChanges = () => {
    const currentIds = currentPlan.map(item => item.title);
    const previousIds = previousPlan.map(item => item.title);
    
    const added = currentPlan.filter(item => !previousIds.includes(item.title));
    const removed = previousPlan.filter(item => !currentIds.includes(item.title));
    const changed = currentPlan.filter(item => {
      const prevItem = previousPlan.find(p => p.title === item.title);
      return prevItem && (
        prevItem.description !== item.description ||
        prevItem.status !== item.status ||
        prevItem.priority !== item.priority
      );
    });

    return { added, removed, changed };
  };

  const changes = getChanges();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">{currentPeriod}</h3>
          <div className="space-y-2">
            {currentPlan.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="text-sm">{item.title}</span>
                <Badge className={getCategoryColor(item.category || 'Enhancement')}>
                  {item.category || 'Enhancement'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">{previousPeriod}</h3>
          <div className="space-y-2">
            {previousPlan.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="text-sm">{item.title}</span>
                <Badge className={getCategoryColor(item.category || 'Enhancement')}>
                  {item.category || 'Enhancement'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {(changes.added.length > 0 || changes.removed.length > 0 || changes.changed.length > 0) && (
        <div className="space-y-4">
          {changes.added.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-green-500" />
                <h4 className="font-medium text-green-700">Added Items ({changes.added.length})</h4>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.added.map(item => (
                      <TableRow key={item.id} className="bg-green-50">
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(item.category || 'Enhancement')}>
                            {item.category || 'Enhancement'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.priority || 'Medium'}</TableCell>
                        <TableCell>{item.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {changes.removed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Minus className="h-4 w-4 text-red-500" />
                <h4 className="font-medium text-red-700">Removed Items ({changes.removed.length})</h4>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.removed.map(item => (
                      <TableRow key={item.id} className="bg-red-50">
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(item.category || 'Enhancement')}>
                            {item.category || 'Enhancement'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.priority || 'Medium'}</TableCell>
                        <TableCell>{item.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {changes.changed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Edit className="h-4 w-4 text-amber-500" />
                <h4 className="font-medium text-amber-700">Modified Items ({changes.changed.length})</h4>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.changed.map(item => (
                      <TableRow key={item.id} className="bg-amber-50">
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(item.category || 'Enhancement')}>
                            {item.category || 'Enhancement'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.priority || 'Medium'}</TableCell>
                        <TableCell>{item.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanComparison;