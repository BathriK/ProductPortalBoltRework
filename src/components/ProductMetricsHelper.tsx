
import React, { useEffect, useState } from 'react';
import { Product, Metric } from '../lib/types';

interface ProductMetricsHelperProps {
  product: Product;
}

const ProductMetricsHelper: React.FC<ProductMetricsHelperProps> = ({ product }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('ProductMetricsHelper: Checking metrics for', product.name);
    
    // Only add initial data if no metrics exist
    if (!isInitialized && (!product.metrics || product.metrics.length === 0)) {
      console.log('Adding initial metrics for', product.name);
      
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      // Default metrics for new products
      const initialMetrics = [
        {
          id: `metric-${product.id}-1`,
          name: "User Satisfaction",
          value: 85,
          previousValue: 75,
          unit: "%",
          timestamp: currentDate.toISOString(),
          description: "User satisfaction score",
          month: month,
          year: year
        },
        {
          id: `metric-${product.id}-2`,
          name: "System Uptime",
          value: 99.8,
          previousValue: 98.5,
          unit: "%",
          timestamp: currentDate.toISOString(),
          description: "System availability",
          month: month,
          year: year
        },
        {
          id: `metric-${product.id}-3`,
          name: "Response Time",
          value: 0.8,
          previousValue: 1.2,
          unit: "sec",
          timestamp: currentDate.toISOString(),
          description: "Average API response time",
          month: month,
          year: year
        }
      ];
      
      // Update the product with initial metrics
      if (!product.metrics) {
        product.metrics = [];
      }
      
      product.metrics = [...initialMetrics];
      setIsInitialized(true);
      console.log('Initial metrics added for', product.name, product.metrics.length);
    }
  }, [product, isInitialized]);
  
  return null; // This component doesn't render anything
};

export default ProductMetricsHelper;
