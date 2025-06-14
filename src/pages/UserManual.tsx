import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Download, Eye, Edit, Plus, GitCompare, FileText, Target, Calendar, BarChart3 } from 'lucide-react';

const UserManual: React.FC = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('admin');

  const roles = [
    { id: 'admin', name: 'Administrator', color: 'bg-red-100 text-red-800' },
    { id: 'product_manager', name: 'Product Manager', color: 'bg-blue-100 text-blue-800' },
    { id: 'stakeholder', name: 'Stakeholder', color: 'bg-green-100 text-green-800' }
  ];

  const ScreenshotPlaceholder = ({ title, description }: { title: string; description: string }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 my-4 text-center bg-gray-50">
      <div className="text-gray-500 mb-2">📸 Screenshot Placeholder</div>
      <div className="font-medium text-gray-700">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{description}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Manual</h1>
              <p className="text-gray-600 mt-2">Complete guide for using the Product Portal Dashboard</p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
          </div>
        </div>

        <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            {roles.map((role) => (
              <TabsTrigger key={role.id} value={role.id} className="flex items-center gap-2">
                <Badge className={role.color}>{role.name}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ADMINISTRATOR MANUAL */}
          <TabsContent value="admin" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Administrator</Badge>
                  Complete Access Guide
                </CardTitle>
                <CardDescription>
                  As an Administrator, you have full access to all features including system configuration, user management, and all product data.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Dashboard Overview */}
            <Card>
              <CardHeader>
                <CardTitle>1. Dashboard Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Getting Started</h4>
                <p>Upon login, you'll see the main dashboard with all portfolios and products.</p>
                
                <ScreenshotPlaceholder 
                  title="Main Dashboard View" 
                  description="Show the complete dashboard with portfolio cards, search bar, and navigation header"
                />
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Key Features Available:</h5>
                  <ul className="list-disc pl-5 text-blue-700 space-y-1">
                    <li>View all portfolios and products</li>
                    <li>Access configuration settings</li>
                    <li>Manage user permissions</li>
                    <li>Edit any product data</li>
                    <li>Create and manage release notes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>2. Navigation & Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Using the Search Function</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Click on the search bar in the top navigation</li>
                  <li>Type your search query (product names, features, etc.)</li>
                  <li>Use filters to narrow down results by portfolio or product type</li>
                  <li>Click on any result to navigate directly to that product</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Search Interface" 
                  description="Show the search bar, filters, and search results page"
                />
              </CardContent>
            </Card>

            {/* Product Management */}
            <Card>
              <CardHeader>
                <CardTitle>3. Product Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Viewing Product Details</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Click on any product card from the dashboard</li>
                    <li>Navigate through the available tabs: Roadmap, Release Goals, Release Plan, Metrics, Release Notes</li>
                    <li>Use the month/year selector to view historical data</li>
                    <li>Click the "Compare" button to compare different versions</li>
                  </ol>
                  
                  <ScreenshotPlaceholder 
                    title="Product Detail View" 
                    description="Show product page with all tabs visible and month/year selector"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Editing Products</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>From any product page, click the "Edit" button</li>
                    <li>Navigate through the edit tabs to modify different sections</li>
                    <li>Make your changes in the respective sections</li>
                    <li>Click "Save Changes" to apply modifications</li>
                  </ol>
                  
                  <ScreenshotPlaceholder 
                    title="Product Edit Interface" 
                    description="Show the edit mode with all editable tabs and save/cancel buttons"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Roadmap Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  4. Roadmap Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Creating and Managing Roadmaps</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Navigate to a product and click the "Edit" button</li>
                  <li>Go to the "Roadmap" tab</li>
                  <li>Select the year you want to create a roadmap for</li>
                  <li>Click "Add Roadmap" to create a new version</li>
                  <li>Fill in the roadmap details and link</li>
                  <li>Save your changes</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Roadmap Creation Form" 
                  description="Show the roadmap creation interface with year selector and form fields"
                />
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">💡 Best Practices:</h5>
                  <ul className="list-disc pl-5 text-yellow-700 space-y-1">
                    <li>Use clear version numbering (1.0, 1.1, 2.0)</li>
                    <li>Include direct links to roadmap documents</li>
                    <li>Update roadmaps quarterly or as needed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Release Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  5. Release Goals Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Setting Release Goals</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>In edit mode, navigate to the "Release Goals" tab</li>
                  <li>Select the month and year for the release</li>
                  <li>Add individual goals using the goal editor</li>
                  <li>Set priority levels and target dates</li>
                  <li>Save the goal set as a new version</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Release Goals Editor" 
                  description="Show the goals editing interface with goal items and month/year selector"
                />
              </CardContent>
            </Card>

            {/* Release Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  6. Release Plan Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Creating Release Plans</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Navigate to the "Release Plan" tab in edit mode</li>
                  <li>Select the target month and year</li>
                  <li>Add plan items with descriptions and timelines</li>
                  <li>Organize items by priority or phase</li>
                  <li>Save as a versioned release plan</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Release Plan Editor" 
                  description="Show the release plan interface with item management and scheduling tools"
                />
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  7. Metrics Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Managing Product Metrics</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to the "Metrics" tab in edit mode</li>
                  <li>Add or update metric values for the selected period</li>
                  <li>Include KPIs, performance indicators, and success metrics</li>
                  <li>Save metric data for historical tracking</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Metrics Dashboard" 
                  description="Show the metrics editing interface with charts and data input fields"
                />
              </CardContent>
            </Card>

            {/* Release Notes */}
            <Card>
              <CardHeader>
                <CardTitle>8. Release Notes Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Creating and Managing Release Notes</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Navigate to the "Release Notes" tab in edit mode</li>
                  <li>Select the month and year for the release</li>
                  <li>Add the release notes document link</li>
                  <li>System automatically creates version numbers</li>
                  <li>Save to make notes available to all users</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Release Notes Management" 
                  description="Show the release notes creation form and version history table"
                />
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">🔒 Admin Privileges:</h5>
                  <ul className="list-disc pl-5 text-green-700 space-y-1">
                    <li>Create, edit, and delete release notes</li>
                    <li>Manage all versions and historical data</li>
                    <li>Access notes across all products</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>9. System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Accessing Configuration Settings</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Click on "Config" in the main navigation</li>
                  <li>Manage user roles and permissions</li>
                  <li>Configure system-wide settings</li>
                  <li>Import/export data configurations</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Configuration Dashboard" 
                  description="Show the admin configuration interface with user management and system settings"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRODUCT MANAGER MANUAL */}
          <TabsContent value="product_manager" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Product Manager</Badge>
                  Product Management Guide
                </CardTitle>
                <CardDescription>
                  As a Product Manager, you can view all products and edit the ones you manage, including creating release notes and updating product information.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Dashboard Access */}
            <Card>
              <CardHeader>
                <CardTitle>1. Dashboard Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Your Dashboard View</h4>
                <p>You have access to view all portfolios and products, with editing capabilities for products you manage.</p>
                
                <ScreenshotPlaceholder 
                  title="Product Manager Dashboard" 
                  description="Show dashboard with visible edit buttons on manageable products"
                />
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Your Capabilities:</h5>
                  <ul className="list-disc pl-5 text-blue-700 space-y-1">
                    <li>View all products and portfolios</li>
                    <li>Edit products you manage</li>
                    <li>Create and manage release notes</li>
                    <li>Update roadmaps, goals, plans, and metrics</li>
                    <li>Compare different product versions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Product Editing */}
            <Card>
              <CardHeader>
                <CardTitle>2. Editing Your Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">How to Edit Product Information</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Navigate to one of your managed products</li>
                  <li>Click the "Edit" button (visible only for your products)</li>
                  <li>Use the tabs to update different sections</li>
                  <li>Make your changes and save</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Product Edit Mode" 
                  description="Show the edit interface with all tabs available to product managers"
                />
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h5>
                  <ul className="list-disc pl-5 text-yellow-700 space-y-1">
                    <li>You can only edit products you manage</li>
                    <li>Changes are versioned automatically</li>
                    <li>Always save your changes before navigating away</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Release Management */}
            <Card>
              <CardHeader>
                <CardTitle>3. Release Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Managing Release Goals</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>In edit mode, go to "Release Goals" tab</li>
                    <li>Set monthly/quarterly goals for your product</li>
                    <li>Define success criteria and key milestones</li>
                    <li>Track progress against previous versions</li>
                  </ol>
                  
                  <ScreenshotPlaceholder 
                    title="Release Goals Management" 
                    description="Show goals editor with progress tracking"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Creating Release Plans</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Navigate to "Release Plan" tab</li>
                    <li>Outline feature delivery timelines</li>
                    <li>Set dependencies and priorities</li>
                    <li>Coordinate with development schedules</li>
                  </ol>
                  
                  <ScreenshotPlaceholder 
                    title="Release Planning Interface" 
                    description="Show release plan editor with timeline and dependency management"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Release Notes */}
            <Card>
              <CardHeader>
                <CardTitle>4. Release Notes Creation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Publishing Release Notes</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to edit mode and select "Release Notes" tab</li>
                  <li>Choose the release month and year</li>
                  <li>Add link to your release notes document</li>
                  <li>System creates automatic versioning</li>
                  <li>Save to publish for all users to view</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Release Notes Creation" 
                  description="Show the release notes form with month/year selector and link input"
                />
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">✅ Best Practices:</h5>
                  <ul className="list-disc pl-5 text-green-700 space-y-1">
                    <li>Include clear feature descriptions</li>
                    <li>Highlight breaking changes</li>
                    <li>Provide migration guides when needed</li>
                    <li>Link to detailed documentation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Analytics and Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>5. Analytics and Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Tracking Product Performance</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Use the "Metrics" tab to input performance data</li>
                  <li>Track KPIs and success metrics</li>
                  <li>Compare performance across time periods</li>
                  <li>Use data to inform future planning</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Metrics Dashboard" 
                  description="Show metrics interface with charts and KPI tracking"
                />
              </CardContent>
            </Card>

            {/* Collaboration */}
            <Card>
              <CardHeader>
                <CardTitle>6. Collaboration Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Working with Your Team</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Use version comparison to track changes</li>
                  <li>Share product links with stakeholders</li>
                  <li>Coordinate with other product managers</li>
                  <li>Maintain historical records for reference</li>
                </ul>
                
                <ScreenshotPlaceholder 
                  title="Collaboration Tools" 
                  description="Show comparison view and sharing features"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* STAKEHOLDER MANUAL */}
          <TabsContent value="stakeholder" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Stakeholder</Badge>
                  Read-Only Access Guide
                </CardTitle>
                <CardDescription>
                  As a Stakeholder, you have read-only access to view all product information, roadmaps, goals, plans, and metrics across all portfolios.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Dashboard Overview */}
            <Card>
              <CardHeader>
                <CardTitle>1. Dashboard Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Your View</h4>
                <p>You can view all portfolios and products with complete read-only access to track progress and stay informed.</p>
                
                <ScreenshotPlaceholder 
                  title="Stakeholder Dashboard" 
                  description="Show dashboard without edit buttons, emphasizing view-only access"
                />
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">What You Can Access:</h5>
                  <ul className="list-disc pl-5 text-green-700 space-y-1">
                    <li>View all product portfolios</li>
                    <li>Access product roadmaps and timelines</li>
                    <li>Review release goals and plans</li>
                    <li>Monitor product metrics and KPIs</li>
                    <li>Compare different versions of data</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>2. Finding Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Using Search and Filters</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Use the search bar to find specific products or features</li>
                  <li>Apply filters to narrow down results</li>
                  <li>Browse by portfolio to see related products</li>
                  <li>Click on any product to view detailed information</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Search and Navigation" 
                  description="Show search interface and portfolio browsing for stakeholders"
                />
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>3. Viewing Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Understanding Product Pages</h4>
                  <p className="mb-3">Each product page contains multiple tabs with different types of information:</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-blue-600 mb-2 flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Roadmap
                      </h5>
                      <p className="text-sm text-gray-600">View product roadmaps and future plans organized by year</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-green-600 mb-2 flex items-center">
                        <Target className="mr-2 h-4 w-4" />
                        Release Goals
                      </h5>
                      <p className="text-sm text-gray-600">See specific goals and objectives for each release period</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-purple-600 mb-2 flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Release Plan
                      </h5>
                      <p className="text-sm text-gray-600">Review detailed release plans and timelines</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-orange-600 mb-2 flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Metrics
                      </h5>
                      <p className="text-sm text-gray-600">Monitor performance metrics and KPIs</p>
                    </div>
                  </div>
                  
                  <ScreenshotPlaceholder 
                    title="Product Tab Navigation" 
                    description="Show all available tabs for stakeholder view (excluding Release Notes)"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Using Time Period Selectors</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Use month/year selectors to view historical data</li>
                    <li>Compare different time periods</li>
                    <li>Track progress over time</li>
                    <li>Access archived information</li>
                  </ol>
                  
                  <ScreenshotPlaceholder 
                    title="Time Period Selection" 
                    description="Show month/year selector interface and historical data access"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Roadmap Viewing */}
            <Card>
              <CardHeader>
                <CardTitle>4. Understanding Roadmaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Reading Product Roadmaps</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Roadmaps show planned features and major releases</li>
                  <li>Use year selector to view different roadmap periods</li>
                  <li>Multiple versions may exist for comparison</li>
                  <li>Click on external links to view detailed roadmap documents</li>
                </ul>
                
                <ScreenshotPlaceholder 
                  title="Roadmap Viewer" 
                  description="Show roadmap display with version history and external links"
                />
              </CardContent>
            </Card>

            {/* Goals and Plans */}
            <Card>
              <CardHeader>
                <CardTitle>5. Release Goals and Plans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Viewing Release Goals</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Goals are organized by month and year</li>
                    <li>Each goal includes objectives and success criteria</li>
                    <li>Track goal achievement over time</li>
                    <li>Compare goals across different releases</li>
                  </ul>
                  
                  <ScreenshotPlaceholder 
                    title="Release Goals Display" 
                    description="Show goals viewer with monthly organization and progress tracking"
                  />
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Understanding Release Plans</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Plans detail specific features and improvements</li>
                    <li>View delivery timelines and priorities</li>
                    <li>See dependencies between features</li>
                    <li>Track plan execution status</li>
                  </ul>
                  
                  <ScreenshotPlaceholder 
                    title="Release Plan Viewer" 
                    description="Show release plan interface with timeline and feature details"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Metrics and Performance */}
            <Card>
              <CardHeader>
                <CardTitle>6. Metrics and Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Understanding Product Metrics</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>View key performance indicators (KPIs)</li>
                  <li>Monitor success metrics over time</li>
                  <li>Compare performance across periods</li>
                  <li>Access historical trend data</li>
                </ul>
                
                <ScreenshotPlaceholder 
                  title="Metrics Dashboard" 
                  description="Show metrics display with charts and performance indicators"
                />
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">📊 Metric Types You'll See:</h5>
                  <ul className="list-disc pl-5 text-blue-700 space-y-1">
                    <li>User engagement metrics</li>
                    <li>Performance benchmarks</li>
                    <li>Feature adoption rates</li>
                    <li>Quality indicators</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Comparison Tools */}
            <Card>
              <CardHeader>
                <CardTitle>7. Using Comparison Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">Comparing Different Versions</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Look for "Compare" buttons on product pages</li>
                  <li>Select different versions or time periods</li>
                  <li>Review side-by-side comparisons</li>
                  <li>Identify changes and evolution over time</li>
                </ol>
                
                <ScreenshotPlaceholder 
                  title="Comparison Interface" 
                  description="Show version comparison tools and side-by-side view"
                />
              </CardContent>
            </Card>

            {/* Tips for Stakeholders */}
            <Card>
              <CardHeader>
                <CardTitle>8. Tips for Effective Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">💡 Best Practices</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Bookmark frequently viewed products</li>
                      <li>Use filters to focus on relevant information</li>
                      <li>Check for updates regularly</li>
                      <li>Use comparison tools to track progress</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-3">🔍 What to Look For</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Recent updates and changes</li>
                      <li>Upcoming milestones</li>
                      <li>Performance trends</li>
                      <li>Goal achievement status</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">💬 Need More Information?</h5>
                  <p className="text-sm text-gray-600">
                    Contact the respective Product Managers or Administrators for detailed explanations or additional access if needed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserManual;