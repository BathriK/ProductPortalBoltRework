
// Centralized event management for data updates
export type DataUpdateEvent = {
  productId: string;
  type: 'metrics' | 'goals' | 'plans' | 'notes' | 'roadmap' | 'all';
  month?: number;
  year?: number;
};

export class DataEventManager {
  private static instance: DataEventManager;

  static getInstance() {
    if (!DataEventManager.instance) {
      DataEventManager.instance = new DataEventManager();
    }
    return DataEventManager.instance;
  }

  // Dispatch a data update event
  dispatchDataUpdate(event: DataUpdateEvent) {
    console.log('DataEventManager: Dispatching data update:', event);
    
    // Dispatch the main product data update event
    window.dispatchEvent(new CustomEvent('productDataUpdated', { 
      detail: event 
    }));

    // Dispatch specific type events for backwards compatibility
    if (event.type === 'roadmap') {
      window.dispatchEvent(new CustomEvent('roadmapUpdated', { 
        detail: event 
      }));
    }

    // Dispatch month/year filter change if applicable
    if (event.month && event.year) {
      window.dispatchEvent(new CustomEvent('monthYearFilterChange', {
        detail: { month: event.month, year: event.year }
      }));
    }
  }

  // Listen for data updates
  addDataUpdateListener(callback: (event: DataUpdateEvent) => void) {
    const handler = (e: CustomEvent) => {
      callback(e.detail);
    };

    window.addEventListener('productDataUpdated', handler as EventListener);
    
    return () => {
      window.removeEventListener('productDataUpdated', handler as EventListener);
    };
  }

  // Listen for month/year filter changes
  addFilterChangeListener(callback: (month: number, year: number) => void) {
    const handler = (e: CustomEvent) => {
      if (e.detail?.month && e.detail?.year) {
        callback(e.detail.month, e.detail.year);
      }
    };

    window.addEventListener('monthYearFilterChange', handler as EventListener);
    
    return () => {
      window.removeEventListener('monthYearFilterChange', handler as EventListener);
    };
  }
}

export const dataEventManager = DataEventManager.getInstance();
