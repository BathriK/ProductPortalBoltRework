
import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface StatusIconProps {
  status: string;
  size?: number;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 16 }) => {
  const getStatusIcon = () => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={size} className="text-green-600" />;
      case 'in-progress':
        return <Clock size={size} className="text-blue-600" />;
      case 'planned':
        return <AlertCircle size={size} className="text-yellow-600" />;
      case 'delayed':
        return <XCircle size={size} className="text-red-600" />;
      default:
        return <AlertCircle size={size} className="text-gray-600" />;
    }
  };

  return getStatusIcon();
};

export default StatusIcon;
