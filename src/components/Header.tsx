import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '../contexts/AuthContext';
import { useProductEdit } from '../contexts/ProductEditContext';
import { Button } from './ui/button';
import { Search } from './Search';
import Logo from './Logo';
import { LogOut, User, Settings, Target, FileText, BarChart3, GitCompare, Lock } from 'lucide-react';

const Header = () => {
  const {
    user,
    logout
  } = useAuth();
  const {
    isAdmin
  } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use ProductEditContext for filter state if available (on product edit pages)
  const productEditContext = React.useContext(React.createContext<any>(undefined));
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 font-['Pathway_Extreme']">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          
          <div className="flex-1 max-w-md mx-4">
            <Search />
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant={isActivePath('/') && location.pathname === '/' ? "default" : "ghost"} size="sm" asChild className={`hidden sm:flex items-center gap-2 tnq-font ${isActivePath('/') && location.pathname === '/' ? 'tnq-button' : 'tnq-button-outline'}`}>
              <Link to="/">
                <BarChart3 className="h-4 w-4" />
                Product Dashboard
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild className={`hidden sm:flex tnq-font ${isActivePath('/comparison') ? 'text-tnq-blue' : ''}`} title="Comparison">
              <Link to="/comparison">
                <GitCompare className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="sm" asChild className={`hidden sm:flex tnq-font ${isActivePath('/annual-okrs') ? 'text-tnq-blue' : ''}`} title="Annual OKRs">
              <Link to="/annual-okrs">
                <Target className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild className={`hidden sm:flex tnq-font ${isActivePath('/user-manual') ? 'text-tnq-blue' : ''}`} title="User Manual">
              <Link to="/user-manual">
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
            
            {user && <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="relative group">
                    <Button variant="ghost" size="sm" className="relative tnq-font">
                      <User className="h-4 w-4" />
                    </Button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 tnq-font">{user.name || user.email}</p>
                        <p className="text-xs text-gray-500 capitalize tnq-font">{user.role || 'User'}</p>
                      </div>
                      <div className="p-2">
                        <Link to="/change-password" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full text-left">
                          <Lock className="h-4 w-4" />
                          Change Password
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && <Button variant="ghost" size="sm" asChild className={`tnq-font ${isActivePath('/config') ? 'border-b-2 border-blue-500' : ''}`}>
                      <Link to="/config">
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>}
                  
                  <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout" className="tnq-font">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </header>;
};

export default Header;