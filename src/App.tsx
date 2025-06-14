import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Index';
import ProductDetail from './pages/ProductDetail';
import PortfolioPage from './pages/PortfolioDetail';
import Reports from './pages/Reports';
import SearchPage from './pages/SearchResults';
import AnnualOKRs from './pages/AnnualOKRs';
import ComparisonPage from './pages/ComparisonPage';
import Config from './pages/Config';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"
import UnauthorizedPage from './pages/Unauthorized';
import ProductEditPage from "./pages/ProductEditPage";
import ChangePassword from './pages/ChangePassword'; // Import the new ChangePassword page

// ProtectedRoute component
function ProtectedRoute({ children, requiredRoles }: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!user) {
    return <LoginPage />; // Redirect to login if not authenticated
  }

  if (requiredRoles && !requiredRoles.some(role => user.role === role || (user.role === 'admin'))) {
    return <UnauthorizedPage />; // Redirect to unauthorized page
  }

  return <>{children}</>;
}

function App() {
  const queryClient = new QueryClient();

  return (
    <Router>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/comparison" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
            <Route path="/products/:productId" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="/products/:productId/edit" element={
              <ProtectedRoute requiredRoles={['admin', 'product_manager']}>
                <ProductEditPage />
              </ProtectedRoute>
            } />
            <Route path="/portfolios/:portfolioId" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/annual-okrs" element={<ProtectedRoute><AnnualOKRs /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/config" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Config />
              </ProtectedRoute>
            } />
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;