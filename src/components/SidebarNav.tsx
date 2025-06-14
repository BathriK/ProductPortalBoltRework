
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Target, Settings, FileText, Calendar, ChevronDown, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { usePermissions } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface SidebarNavProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ isCollapsed = false, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  
  // State for product dropdowns
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Overview of all products'
    },
    {
      title: 'Annual OKRs',
      href: '/annual-okrs',
      icon: Target,
      description: 'Annual objectives and key results'
    },
    {
      title: 'Summary Insights',
      href: '/summary-insights',
      icon: BarChart3,
      description: 'Analytics and insights'
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: FileText,
      description: 'Analytics and reports'
    },
    {
      title: 'User Manual',
      href: '/user-manual',
      icon: FileText,
      description: 'Help and documentation'
    }
  ];

  // Products with sub-navigation
  const products = [
    { id: 'xml-central', name: 'XML Central' },
    { id: 'edit-central', name: 'Edit Central' },
    { id: 'ace', name: 'ACE' }
  ];

  // Add admin-only items
  if (isAdmin) {
    navigationItems.push({
      title: 'Configuration',
      href: '/config',
      icon: Settings,
      description: 'System settings'
    });
  }

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductNavigation = (productId: string, tab: string) => {
    navigate(`/products/${productId}`, { 
      state: { activeTab: tab }
    });
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white shadow-sm border-r border-gray-200 h-[calc(100vh-4rem)] fixed left-0 top-16 z-40">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full flex justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="space-y-2 mt-4">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={item.title}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-tnq-purple text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-[calc(100vh-4rem)] fixed left-0 top-16 z-40">
      <nav className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700">Navigation</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-tnq-purple text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <div>
                  <div>{item.title}</div>
                  <div className={cn(
                    "text-xs",
                    isActive ? "text-purple-100" : "text-gray-500"
                  )}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Products Section */}
        <div className="mt-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Products
          </h4>
          <div className="space-y-1">
            {products.map((product) => {
              const isExpanded = expandedProducts.includes(product.id);
              return (
                <div key={product.id}>
                  <button
                    onClick={() => toggleProductExpansion(product.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="truncate">{product.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      <button
                        onClick={() => handleProductNavigation(product.id, 'roadmap')}
                        className="w-full text-left px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        Roadmap
                      </button>
                      <button
                        onClick={() => handleProductNavigation(product.id, 'goals')}
                        className="w-full text-left px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        Release Goals
                      </button>
                      <button
                        onClick={() => handleProductNavigation(product.id, 'plan')}
                        className="w-full text-left px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        Release Plans
                      </button>
                      <button
                        onClick={() => handleProductNavigation(product.id, 'metrics')}
                        className="w-full text-left px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        Metrics
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default SidebarNav;
