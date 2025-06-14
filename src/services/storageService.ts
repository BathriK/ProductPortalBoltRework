// src/services/storageService.ts
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns'; // Import the format function

export interface StorageAdapter {
  saveXML(path: string, content: string): Promise<boolean>;
  loadXML(path: string): Promise<string | null>;
  listXMLs(prefix?: string): Promise<string[]>;
  deleteXML(path: string): Promise<boolean>;
  publishXML(path: string, content: string): Promise<boolean>;
}

export interface StorageConfig {
  type: 'local' | 'supabase';
  supabaseUrl?: string;
  supabaseKey?: string;
  bucketName?: string;
}

// Local storage adapter (fallback behavior)
class LocalStorageAdapter implements StorageAdapter {
  async saveXML(path: string, content: string): Promise<boolean> {
    try {
      console.log(`LocalStorageAdapter: Saving XML to ${path}`);
      
      // Ensure path uses forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Create a backup of existing file if it exists
      const existingContent = localStorage.getItem(normalizedPath);
      if (existingContent) {
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const backupPath = `${normalizedPath}.backup.${timestamp}`;
        localStorage.setItem(backupPath, existingContent);
        console.log(`LocalStorageAdapter: Created backup at ${backupPath}`);
      }
      
      // Perform atomic write by first writing to a temporary location
      const tempPath = `${normalizedPath}.temp`;
      localStorage.setItem(tempPath, content);
      
      // Then move to the final location
      localStorage.setItem(normalizedPath, content);
      localStorage.removeItem(tempPath);
      
      console.log(`LocalStorageAdapter: Successfully saved XML to ${normalizedPath}`);
      return true;
    } catch (error) {
      console.error('LocalStorageAdapter: Error saving XML:', error);
      return false;
    }
  }

  async loadXML(path: string): Promise<string | null> {
    try {
      // Ensure path uses forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Check if this is a public file that should be fetched via HTTP
      if (normalizedPath.startsWith('public/')) {
        try {
          console.log(`LocalStorageAdapter: Fetching public file via HTTP: ${normalizedPath}`);
          // Remove 'public/' prefix for the fetch URL since public files are served from root
          const fetchPath = normalizedPath.replace('public/', '/');
          const response = await fetch(fetchPath);
          
          if (!response.ok) {
            console.error(`LocalStorageAdapter: Failed to fetch ${fetchPath}: ${response.status} ${response.statusText}`);
            return null;
          }
          
          const content = await response.text();
          console.log(`LocalStorageAdapter: Successfully fetched public file: ${normalizedPath}`);
          return content;
        } catch (fetchError) {
          console.error(`LocalStorageAdapter: Error fetching public file ${normalizedPath}:`, fetchError);
          return null;
        }
      }
      
      // For non-public files, use localStorage
      return localStorage.getItem(normalizedPath);
    } catch (error) {
      console.error('LocalStorageAdapter: Error loading XML:', error);
      return null;
    }
  }

  async listXMLs(prefix?: string): Promise<string[]> {
    try {
      const keys = Object.keys(localStorage);
      const normalizedPrefix = prefix ? prefix.replace(/\\/g, '/') : '';
      
      // Filter keys that start with the prefix and end with .xml
      return keys.filter(key => key.startsWith(normalizedPrefix) && key.endsWith('.xml'))
                 .map(key => key.replace(normalizedPrefix, '')); // Return just the filename
    } catch (error) {
      console.error('LocalStorageAdapter: Error listing XMLs:', error);
      return [];
    }
  }

  async deleteXML(path: string): Promise<boolean> {
    try {
      // Ensure path uses forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Create a backup before deleting
      const content = localStorage.getItem(normalizedPath);
      if (content) {
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        const backupPath = `${normalizedPath}.deleted.${timestamp}`;
        localStorage.setItem(backupPath, content);
        console.log(`LocalStorageAdapter: Created backup before delete at ${backupPath}`);
      }
      
      localStorage.removeItem(normalizedPath);
      return true;
    } catch (error) {
      console.error('LocalStorageAdapter: Error deleting XML:', error);
      return false;
    }
  }

  async publishXML(path: string, content: string): Promise<boolean> {
    // For local storage, publishing is the same as saving but with a different prefix
    // Ensure path uses forward slashes
    const normalizedPath = path.replace(/\\/g, '/');
    return this.saveXML(`published/${normalizedPath}`, content);
  }
}

// Supabase storage adapter using direct API calls
class SupabaseStorageAdapter implements StorageAdapter {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  // Helper function to delay execution
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveXML(path: string, content: string): Promise<boolean> {
    try {
      console.log('SupabaseStorageAdapter: Saving XML to Supabase:', path);
      
      // Ensure path uses forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Convert content to blob for upload
      const blob = new Blob([content], { type: 'application/xml' });
      
      // Use the supabase client directly
      const { error } = await supabase.storage
        .from(this.config.bucketName || 'xml-storage')
        .upload(normalizedPath, blob, {
          upsert: true,
          contentType: 'application/xml'
        });
      
      if (error) {
        console.error('SupabaseStorageAdapter: Error saving XML:', error);
        return false;
      }
      
      console.log('SupabaseStorageAdapter: Successfully saved XML to Supabase');
      return true;
    } catch (error) {
      console.error('SupabaseStorageAdapter: Error saving XML:', error);
      return false;
    }
  }

  async loadXML(path: string): Promise<string | null> {
    try {
      console.log('SupabaseStorageAdapter: Loading XML from Supabase:', path);
      
      // Ensure path uses forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Use the supabase client directly
      const { data, error } = await supabase.storage
        .from(this.config.bucketName || 'xml-storage')
        .download(normalizedPath);
      
      if (error) {
        console.error('SupabaseStorageAdapter: Error loading XML:', error);
        return null;
      }
      
      // Convert blob to text
      const content = await data.text();
      console.log('SupabaseStorageAdapter: Successfully loaded XML from Supabase');
      return content;
    } catch (error) {
      console.error('SupabaseStorageAdapter: Error loading XML:', error);
      return null;
    }
  }

  async listXMLs(prefix?: string): Promise<string[]> {
    try {
      console.log('SupabaseStorageAdapter: Listing XMLs from Supabase, prefix:', prefix);
      
      // Ensure prefix uses forward slashes
      const normalizedPrefix = prefix ? prefix.replace(/\\/g, '/') : '';
      
      // Use the supabase client directly
      const { data, error } = await supabase.storage
        .from(this.config.bucketName || 'xml-storage')
        .list(normalizedPrefix, {
          limit: 100,
          offset: 0
        });
      
      if (error) {
        console.error('SupabaseStorageAdapter: Error listing XMLs:', error);
        return [];
      }
      
      // Filter for XML files and return just the filenames
      const files = data
        .filter(file => file.name.endsWith('.xml'))
        .map(file => file.name);
      
      console.log(`SupabaseStorageAdapter: Found ${files.length} XML files in Supabase`);
      return files;
    } catch (error) {
      console.error('SupabaseStorageAdapter: Error listing XMLs:', error);
      return [];
    }
  }

  async deleteXML(path: string): Promise<boolean> {
    try {
      console.log('SupabaseStorageAdapter: Deleting XML from Supabase:', path);
      
      // Ensure path uses forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Use the supabase client directly
      const { error } = await supabase.storage
        .from(this.config.bucketName || 'xml-storage')
        .remove([normalizedPath]);
      
      if (error) {
        console.error('SupabaseStorageAdapter: Error deleting XML:', error);
        return false;
      }
      
      console.log('SupabaseStorageAdapter: Successfully deleted XML from Supabase');
      return true;
    } catch (error) {
      console.error('SupabaseStorageAdapter: Error deleting XML:', error);
      return false;
    }
  }

  async publishXML(path: string, content: string): Promise<boolean> {
    try {
      console.log('SupabaseStorageAdapter: Publishing XML to Supabase:', path);
      
      // Ensure path uses forward slashes
      const normalizedPath = path.replace(/\\/g, '/');
      
      // Convert content to blob for upload
      const blob = new Blob([content], { type: 'application/xml' });
      
      // Use the supabase client directly
      const { error } = await supabase.storage
        .from(this.config.bucketName || 'xml-storage')
        .upload(`published/${normalizedPath}`, blob, {
          upsert: true,
          contentType: 'application/xml'
        });
      
      if (error) {
        console.error('SupabaseStorageAdapter: Error publishing XML:', error);
        return false;
      }
      
      console.log('SupabaseStorageAdapter: Successfully published XML to Supabase');
      return true;
    } catch (error) {
      console.error('SupabaseStorageAdapter: Error publishing XML:', error);
      return false;
    }
  }
}

// Storage service factory
class StorageService {
  private adapter: StorageAdapter;
  private config: StorageConfig;

  constructor(config?: StorageConfig) {
    this.config = config || this.getDefaultConfig();
    this.adapter = this.createAdapter();
  }

  private getDefaultConfig(): StorageConfig {
    // Check for stored config in localStorage
    try {
      const storedConfig = localStorage.getItem('appStorageConfig');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        console.log('StorageService: Using stored config from localStorage:', parsedConfig);
        return {
          type: parsedConfig.storageType || 'supabase',
          supabaseUrl: parsedConfig.supabaseUrl || supabase.supabaseUrl,
          supabaseKey: supabase.supabaseKey,
          bucketName: parsedConfig.bucketName || 'xml-storage'
        };
      }
    } catch (error) {
      console.error('StorageService: Error reading config from localStorage:', error);
    }
    
    // Default to Supabase storage for reliability
    return {
      type: 'supabase',
      supabaseUrl: supabase.supabaseUrl,
      supabaseKey: supabase.supabaseKey,
      bucketName: 'xml-storage'
    };
  }

  private createAdapter(): StorageAdapter {
    console.log('StorageService: Creating adapter with type:', this.config.type);
    switch (this.config.type) {
      case 'supabase':
        return new SupabaseStorageAdapter(this.config);
      default:
        return new LocalStorageAdapter();
    }
  }

  async save(path: string, content: string): Promise<boolean> {
    return this.adapter.saveXML(path, content);
  }

  async load(path: string): Promise<string | null> {
    return this.adapter.loadXML(path);
  }

  async list(prefix?: string): Promise<string[]> {
    return this.adapter.listXMLs(prefix);
  }

  async delete(path: string): Promise<boolean> {
    return this.adapter.deleteXML(path);
  }

  async publish(path: string, content: string): Promise<boolean> {
    return this.adapter.publishXML(path, content);
  }

  // Batch operations
  async saveBatch(items: Array<{ path: string; content: string }>): Promise<boolean[]> {
    const results = await Promise.all(
      items.map(item => this.save(item.path, item.content))
    );
    return results;
  }

  async publishBatch(items: Array<{ path: string; content: string }>): Promise<boolean[]> {
    const results = await Promise.all(
      items.map(item => this.publish(item.path, item.content))
    );
    return results;
  }

  getConfig(): StorageConfig {
    return this.config;
  }

  // Switch storage backend
  switchBackend(config: StorageConfig): void {
    console.log('StorageService: Switching backend to:', config.type);
    this.config = config;
    this.adapter = this.createAdapter();
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default StorageService;