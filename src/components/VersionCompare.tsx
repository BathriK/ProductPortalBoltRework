
import React from 'react';
import { formatDate } from '../lib/utils';
import { TrendingUp, TrendingDown, CircleDot } from 'lucide-react';

interface VersionCompareProps {
  title: string;
  version1: any; // Using any here to handle various types of data
  version2: any; // Using any here to handle various types of data
  renderContent: (data: any, isComparison: boolean) => React.ReactNode;
  differences?: {
    added?: any[];
    deleted?: any[];
    changed?: any[];
  };
  onClose: () => void;
}

const VersionCompare: React.FC<VersionCompareProps> = ({
  title,
  version1,
  version2,
  renderContent,
  differences,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-medium">{title} - Version Comparison</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {differences && (
          <div className="bg-gray-50 p-4 border-b">
            <div className="flex flex-wrap gap-4">
              {differences.added && differences.added.length > 0 && (
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">{differences.added.length}</span> items added
                  </span>
                </div>
              )}
              
              {differences.deleted && differences.deleted.length > 0 && (
                <div className="flex items-center">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">{differences.deleted.length}</span> items removed
                  </span>
                </div>
              )}
              
              {differences.changed && differences.changed.length > 0 && (
                <div className="flex items-center">
                  <CircleDot className="h-4 w-4 text-amber-500 mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">{differences.changed.length}</span> items changed
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="overflow-auto p-4 max-h-[calc(90vh-150px)]">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="mb-4 pb-2 border-b">
                <h3 className="font-medium">Version {version1.version}</h3>
                <div className="text-sm text-gray-500">Created: {formatDate(version1.createdAt)}</div>
              </div>
              {renderContent(version1, true)}
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="mb-4 pb-2 border-b">
                <h3 className="font-medium">Version {version2.version}</h3>
                <div className="text-sm text-gray-500">Created: {formatDate(version2.createdAt)}</div>
              </div>
              {renderContent(version2, true)}
            </div>
          </div>
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionCompare;
