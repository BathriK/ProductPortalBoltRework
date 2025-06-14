
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Heading } from "@/components/ui/heading";
import { usePermissions } from '../contexts/AuthContext';
import DataManagement from '../components/DataManagement';

const Debug: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  // Redirect non-admin users
  if (!isAdmin) {
    navigate('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Heading>Debug & Administration</Heading>
        <p className="text-gray-600 mb-8">
          Administrative tools and debugging features for managing the Product Portal.
        </p>
        
        <div className="space-y-8">
          <DataManagement />
        </div>
      </main>
    </div>
  );
};

export default Debug;
