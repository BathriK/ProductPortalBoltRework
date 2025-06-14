
import React from 'react';
import Header from '../components/Header';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';

const SummaryInsights = () => {
  const insights = [
    {
      title: "Total Products",
      value: "12",
      change: "+2 this month",
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Active Goals",
      value: "45",
      change: "+8 this quarter",
      icon: Target,
      color: "text-green-600"
    },
    {
      title: "Completion Rate",
      value: "87%",
      change: "+5% vs last month",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Team Members",
      value: "24",
      change: "+3 this quarter",
      icon: Users,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="lg:ml-64 px-4 py-8 transition-all duration-200">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-tnq-navy mb-2">Summary Insights</h1>
            <p className="text-gray-600">Overview of key metrics and performance indicators</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {insights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <insight.icon className={`h-8 w-8 ${insight.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-tnq-navy">{insight.value}</h3>
                <p className="text-sm text-gray-600 mb-1">{insight.title}</p>
                <p className="text-xs text-green-600">{insight.change}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-tnq-navy mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Product Alpha roadmap updated</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">New release goals added for Q2</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Metrics report generated</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SummaryInsights;
