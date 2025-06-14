import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductData } from "../hooks/useProductData";
import { ProductEditProvider, useProductEdit } from "../contexts/ProductEditContext";
import Header from "../components/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Breadcrumbs from "@/components/Breadcrumbs";
import { usePermissions } from "../contexts/AuthContext";
import { Card } from "@/components/ui/card";
import ProductEditGoalsGridSection from "../components/ProductEditSections/ProductEditGoalsGridSection";
import ProductEditPlanGridSection from "../components/ProductEditSections/ProductEditPlanGridSection";
import ProductEditMetricsSection from "../components/ProductEditSections/ProductEditMetricsSection";
import ProductEditRoadmapSection from "../components/ProductEditSections/ProductEditRoadmapSection";
import ProductEditNotesSection from "../components/ProductEditSections/ProductEditNotesSection";

const ProductEditPageContent: React.FC = () => {
  const { productId } = useParams<{ productId: string; }>();
  const navigate = useNavigate();
  const { canEdit } = usePermissions();
  const { product, portfolio, loading } = useProductEdit();
  const [activeTab, setActiveTab] = useState("roadmap");

  // Redirect non-authorized users
  if (!canEdit) {
    navigate("/unauthorized");
    return null;
  }

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: product?.name || "Product", href: `/products/${productId}` },
    { label: "Edit", isCurrent: true }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-tnq-lightgray">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tnq-lightgray font-['Pathway_Extreme']">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-tnq-blue tnq-font">Edit Product</h1>
            <p className="text-gray-900 tnq-font">{product?.name}</p>
          </div>
        </div>
        
        <Card className="bg-white rounded-lg shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 px-6 pt-6">
              <div className="flex justify-center">
                <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm inline-flex gap-2">
                  <TabsTrigger 
                    value="roadmap" 
                    className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-gray-700 tnq-font"
                  >
                    Roadmap
                  </TabsTrigger>
                  <TabsTrigger 
                    value="goals" 
                    className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-gray-700 tnq-font"
                  >
                    Release Goals
                  </TabsTrigger>
                  <TabsTrigger 
                    value="plan" 
                    className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-gray-700 tnq-font"
                  >
                    Release Plans
                  </TabsTrigger>
                  <TabsTrigger 
                    value="metrics" 
                    className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-gray-700 tnq-font"
                  >
                    Product Metrics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="px-8 py-2 font-medium text-sm transition-all data-[state=active]:bg-tnq-blue data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md min-w-[120px] text-gray-700 tnq-font"
                  >
                    Release Notes
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <div className="p-6">
              <TabsContent value="roadmap" className="m-0">
                <ProductEditRoadmapSection productId={productId || ""} isEditing={true} />
              </TabsContent>
              
              <TabsContent value="goals" className="m-0">
                <ProductEditGoalsGridSection />
              </TabsContent>
              
              <TabsContent value="plan" className="m-0">
                <ProductEditPlanGridSection />
              </TabsContent>
              
              <TabsContent value="metrics" className="m-0">
                <ProductEditMetricsSection />
              </TabsContent>
              
              <TabsContent value="notes" className="m-0">
                <ProductEditNotesSection productId={productId || ""} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

const ProductEditPage: React.FC = () => {
  const { productId } = useParams<{ productId: string; }>();
  const { product, portfolio, loading } = useProductData(productId);

  if (!productId) {
    return <div>Invalid product ID</div>;
  }

  return (
    <ProductEditProvider>
      <ProductEditDataLoader product={product} portfolio={portfolio} loading={loading}>
        <ProductEditPageContent />
      </ProductEditDataLoader>
    </ProductEditProvider>
  );
};

interface ProductEditDataLoaderProps {
  children: React.ReactNode;
  product: any;
  portfolio: any;
  loading: boolean;
}

const ProductEditDataLoader: React.FC<ProductEditDataLoaderProps> = ({
  children,
  product,
  portfolio,
  loading
}) => {
  const { setProduct, setPortfolio, setLoading } = useProductEdit();

  React.useEffect(() => {
    setProduct(product);
    setPortfolio(portfolio);
    setLoading(loading);
  }, [product, portfolio, loading, setProduct, setPortfolio, setLoading]);

  return <>{children}</>;
};

export default ProductEditPage;