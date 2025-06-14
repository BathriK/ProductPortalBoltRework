
import { supabase } from '@/integrations/supabase/client';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL: https://yxlwsqpcdeiimvcefmko.supabase.co');
    console.log('Supabase Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    
    // Test basic connection with corrected syntax
    const { data, error } = await supabase.from('Portfolios').select('*').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return { success: false, error };
  }
};

export const insertTestData = async () => {
  try {
    console.log('Inserting test data...');
    
    // Insert a test portfolio
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('Portfolios')
      .insert([
        {
          PortfolioID: 'test-portfolio-1',
          PortfolioName: 'Test Portfolio',
          Description: 'A test portfolio for verification',
          Active: true,
          CreatedOn: new Date().toISOString().split('T')[0]
        }
      ])
      .select();
    
    if (portfolioError) {
      console.error('Error inserting portfolio:', portfolioError);
      return { success: false, error: portfolioError };
    }
    
    console.log('Portfolio inserted successfully:', portfolioData);
    
    // Insert a test product
    const { data: productData, error: productError } = await supabase
      .from('Products')
      .insert([
        {
          ID: 'test-product-1',
          ProductName: 'Test Product',
          Description: 'A test product for verification',
          PortfolioID: 'test-portfolio-1',
          Active: true,
          CreatedOn: new Date().toISOString().split('T')[0]
        }
      ])
      .select();
    
    if (productError) {
      console.error('Error inserting product:', productError);
      return { success: false, error: productError };
    }
    
    console.log('Product inserted successfully:', productData);
    
    return { success: true, portfolio: portfolioData, product: productData };
  } catch (error) {
    console.error('Error inserting test data:', error);
    return { success: false, error };
  }
};
