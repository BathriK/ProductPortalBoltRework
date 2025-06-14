
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Target, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface OKRStatusOverviewProps {
  okrs: any[];
}

const OKRStatusOverview: React.FC<OKRStatusOverviewProps> = ({ okrs }) => {
  const getStatusCounts = () => {
    const counts = {
      total: okrs.length,
      'not-started': 0,
      'in-progress': 0,
      'completed': 0,
      'at-risk': 0
    };

    okrs.forEach(okr => {
      const status = okr.status?.toLowerCase() || 'not-started';
      if (counts.hasOwnProperty(status)) {
        counts[status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const statusCards = [
    {
      title: 'Total OKRs',
      value: statusCounts.total,
      icon: Target,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      title: 'Not Started',
      value: statusCounts['not-started'],
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      title: 'In Progress',
      value: statusCounts['in-progress'],
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Completed',
      value: statusCounts.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statusCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OKRStatusOverview;
