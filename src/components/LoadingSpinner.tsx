
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'border-tnq-purple'
}) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-12 h-12 border-4',
    large: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex justify-center items-center h-64">
      <div className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;
