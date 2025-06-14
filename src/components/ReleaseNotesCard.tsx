
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ReleaseNote } from '@/lib/types';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

interface ReleaseNotesCardProps {
  productId: string;
  latestReleaseNote?: ReleaseNote | null;
}

const ReleaseNotesCard: React.FC<ReleaseNotesCardProps> = ({ 
  productId, 
  latestReleaseNote 
}) => {
  return (
    <div className="bg-white rounded-lg border border-[#D9E2EC]">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Release Notes</h3>
          <Link 
            to={`/products/${productId}?tab=notes`}
            className="text-xs text-tnq-blue hover:underline"
          >
            View All
          </Link>
        </div>

        {latestReleaseNote ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">{`${latestReleaseNote.month}/${latestReleaseNote.year}`}</span>
              <span className="text-sm font-medium">v{latestReleaseNote.version}</span>
            </div>
            <div className="mb-3">
              <span className="text-xs text-gray-500">Updated: {formatDate(latestReleaseNote.createdAt)}</span>
            </div>
            {latestReleaseNote.link ? (
              <a 
                href={latestReleaseNote.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-tnq-blue hover:text-tnq-navyBlue hover:underline"
              >
                View Release Notes <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <div className="text-sm text-gray-500">
                No download link available
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-500 mb-2">No release notes available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseNotesCard;
