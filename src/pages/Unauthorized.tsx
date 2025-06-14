
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Access Denied</h1>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              You don't have permission to access this page.
            </p>
            {user && (
              <p className="text-gray-600">
                You're signed in as <span className="font-medium">{user.name}</span> with 
                role: <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/')}
              variant="default"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
