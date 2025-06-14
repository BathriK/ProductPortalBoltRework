import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import MonthYearSelector from './MonthYearSelector';
import { usePermissions } from '../contexts/AuthContext';
import { ExternalLink as ExternalLinkIcon, Target } from 'lucide-react';
import { hasProductObjectives } from '@/services/okrService';

interface ProductDetailHeaderProps {
  productName: string;
  productId: string;
  portfolioName?: string;
  selectedMonth?: number;
  selectedYear?: number;
  onMonthYearChange?: (month: number, year: number) => void;
  showEditButton?: boolean;
  roadmapLink?: string;
  roadmapVersion?: string;
  releaseNotesLink?: string;
  releaseNotesVersion?: string;
}

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
  productName,
  productId,
  portfolioName,
  selectedMonth,
  selectedYear,
  onMonthYearChange,
  showEditButton = true,
  roadmapLink,
  roadmapVersion,
  releaseNotesLink,
  releaseNotesVersion
}) => {
  const { canEdit } = usePermissions();
  const [hasOKRs, setHasOKRs] = React.useState<boolean>(false);

  // Check if product has OKRs
  React.useEffect(() => {
    const checkOKRs = async () => {
      const hasOKRs = hasProductObjectives(productId);
      setHasOKRs(hasOKRs);
    };
    
    checkOKRs();
  }, [productId]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-2xl font-bold text-tnq-navy mb-2">{productName}</h1>
          {portfolioName && (
            <p className="text-sm text-gray-600">
              Portfolio: {portfolioName}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            {showEditButton && canEdit && (
              <Button asChild>
                <Link to={`/products/${productId}/edit`}>
                  Edit Product
                </Link>
              </Button>
            )}
            
            {hasOKRs && (
              <Button variant="outline" asChild>
                <Link to={`/annual-okrs?product=${productId}`}>
                  <Target className="h-4 w-4 mr-2" />
                  View OKRs
                </Link>
              </Button>
            )}
            
            {releaseNotesLink && (
              <Button variant="outline" asChild>
                <a href={releaseNotesLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Release Notes {releaseNotesVersion && `v${releaseNotesVersion}`}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailHeader;