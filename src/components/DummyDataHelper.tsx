
import React, { useEffect, useState } from 'react';
import { Product, ReleaseGoal, ReleasePlan, ReleaseNote, Roadmap } from '../lib/types';

interface DummyDataHelperProps {
  product: Product;
  latestReleaseGoal: ReleaseGoal | undefined;
  latestReleasePlan: ReleasePlan | undefined;
}

const DummyDataHelper: React.FC<DummyDataHelperProps> = ({ 
  product,
  latestReleaseGoal,
  latestReleasePlan
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('DataHelper: Checking data for', product.name);
    
    if (!isInitialized) {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      let dataAdded = false;
      
      // Add roadmap data if needed (annual)
      if (!product.roadmap || product.roadmap.length === 0) {
        console.log('Adding roadmap data for:', product.name);
        const roadmapData: Roadmap = {
          id: `roadmap-${product.id}-${year}-q1`,
          year: year,
          quarter: 1,
          title: "Core Infrastructure",
          description: "Core system improvements",
          status: "completed",
          version: "1.0",
          createdAt: currentDate.toISOString(),
          link: `https://docs.google.com/spreadsheets/d/roadmap-${product.id}`
        };
        
        if (!product.roadmap) {
          product.roadmap = [];
        }
        
        // Add multiple quarter entries
        const quarters = [
          { quarter: 1, title: "Core Infrastructure", description: "Core system improvements", status: "completed" },
          { quarter: 2, title: "UX Enhancements", description: "User experience improvements", status: "in-progress" },
          { quarter: 3, title: "Analytics Platform", description: "Advanced reporting capabilities", status: "planned" },
          { quarter: 4, title: "Mobile Compatibility", description: "Mobile device optimization", status: "planned" }
        ] as const;

        quarters.forEach(q => {
          product.roadmap.push({
            id: `roadmap-${product.id}-${year}-q${q.quarter}`,
            year: year,
            quarter: q.quarter,
            title: q.title,
            description: q.description,
            status: q.status,
            version: "1.0",
            createdAt: currentDate.toISOString(),
            link: `https://docs.google.com/spreadsheets/d/roadmap-${product.id}`
          });
        });
        
        dataAdded = true;
      }
      
      // Add release goals if needed (monthly)
      if (!product.releaseGoals || product.releaseGoals.length === 0) {
        console.log('Adding release goals for:', product.name);
        const currentGoal: ReleaseGoal = {
          id: `release-goal-${product.id}-${month}-${year}-v1`,
          month: month,
          year: year,
          description: "Improve user experience and performance",
          currentState: "3.5/5 rating, 2.5s load time",
          targetState: "4.5/5 rating, 1s load time",
          version: 1,
          createdAt: currentDate.toISOString()
        };
        
        // Add another version for version history
        const olderGoal: ReleaseGoal = {
          id: `release-goal-${product.id}-${month}-${year}-v0`,
          month: month,
          year: year,
          description: "Improve user experience",
          currentState: "3.2/5 rating, 3.0s load time",
          targetState: "4.0/5 rating, 1.5s load time",
          version: 0.5,
          createdAt: new Date(year, month-1, 1).toISOString()
        };
        
        if (!product.releaseGoals) {
          product.releaseGoals = [];
        }
        
        product.releaseGoals = [currentGoal, olderGoal];
        dataAdded = true;
      }
      
      // Add release plans if needed (monthly)
      if (!product.releasePlans || product.releasePlans.length === 0) {
        console.log('Adding release plans for:', product.name);
        const currentPlan: ReleasePlan = {
          id: `release-plan-${product.id}-${month}-${year}-v1`,
          month: month,
          year: year,
          title: "Redesign dashboard",
          description: "Overhaul the main dashboard UX",
          targetDate: new Date(year, month-1, 20).toISOString(),
          status: "in-progress",
          version: 1,
          createdAt: currentDate.toISOString()
        };
        
        // Add another version for version history
        const olderPlan: ReleasePlan = {
          id: `release-plan-${product.id}-${month}-${year}-v0`,
          month: month,
          year: year,
          title: "Initial dashboard redesign",
          description: "First draft of dashboard improvements",
          targetDate: new Date(year, month-1, 20).toISOString(),
          status: "planned",
          version: 0.5,
          createdAt: new Date(year, month-1, 5).toISOString()
        };
        
        if (!product.releasePlans) {
          product.releasePlans = [];
        }
        
        product.releasePlans = [currentPlan, olderPlan];
        dataAdded = true;
      }
      
      // Add release notes for previous month
      if (!product.releaseNotes || product.releaseNotes.length === 0) {
        console.log('Adding release notes for:', product.name);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        
        const releaseNote: ReleaseNote = {
          id: `release-note-${product.id}-${prevMonth}-${prevYear}-v1`,
          month: prevMonth,
          year: prevYear,
          title: "New dashboard layout",
          description: "Implemented improved dashboard with customizable widgets",
          type: "feature",
          highlights: "Major improvements in performance and user experience",
          version: 1,
          createdAt: new Date(prevYear, prevMonth-1, 28).toISOString()
        };
        
        // Add another version for version history
        const olderNote: ReleaseNote = {
          id: `release-note-${product.id}-${prevMonth}-${prevYear}-v0`,
          month: prevMonth,
          year: prevYear,
          title: "Dashboard improvements",
          description: "Early implementation of dashboard changes",
          type: "feature",
          highlights: "Draft release notes",
          version: 0.5,
          createdAt: new Date(prevYear, prevMonth-1, 20).toISOString()
        };
        
        if (!product.releaseNotes) {
          product.releaseNotes = [];
        }
        
        product.releaseNotes = [releaseNote, olderNote];
        dataAdded = true;
      }
      
      if (dataAdded) {
        console.log('Data added for:', product.name);
      }
      
      setIsInitialized(true);
    }
  }, [product, isInitialized, latestReleaseGoal, latestReleasePlan]);
  
  return null; // This component doesn't render anything
};

export default DummyDataHelper;
