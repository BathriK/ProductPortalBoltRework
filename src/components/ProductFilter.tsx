
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { getPortfolios } from '@/lib/data';
import { Product } from '@/lib/types';

interface ProductFilterProps {
  selectedProductId?: string;
  onProductChange?: (productId: string) => void;
  className?: string;
  variant?: 'default' | 'minimal';
}

const ProductFilter: React.FC<ProductFilterProps> = ({ 
  selectedProductId, 
  onProductChange,
  className = "",
  variant = 'default'
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const portfolios = await getPortfolios();
        // Flatten all products from all portfolios
        const products = portfolios.flatMap(portfolio => portfolio.products);
        setAllProducts(products);
        setLoading(false);
      } catch (error) {
        console.error("Error loading products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductChange = (productId: string) => {
    if (onProductChange) {
      onProductChange(productId);
    } else {
      // If no handler is provided, navigate to the product page
      navigate(`/products/${productId}`);
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${className}`}>
        <span className="text-muted-foreground">Loading products...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Select
        value={selectedProductId}
        onValueChange={handleProductChange}
      >
        <SelectTrigger className={variant === 'minimal' ? 'border-none shadow-none focus:ring-0' : ''}>
          <SelectValue placeholder="Select Product" />
        </SelectTrigger>
        <SelectContent>
          {allProducts.map(product => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductFilter;
