import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { importProductXML } from '../lib/xmlUtils';
import { toast } from '../hooks/use-toast';
import { AlertCircle, Upload, Download } from 'lucide-react';
import { clearPortfolioCache } from '../lib/data';
import { format } from 'date-fns';

interface DataExportImportProps {
  productId?: string; // Optional - if provided, enables single product export
}

const DataExportImport: React.FC<DataExportImportProps> = ({ productId }) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsImporting(true);
    
    try {
      // Validate file type
      if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
        toast({
          title: "Invalid file type",
          description: "Please select an XML file",
          variant: "destructive"
        });
        setIsImporting(false);
        return;
      }
      
      // Show confirmation dialog
      setIsImportDialogOpen(true);
    } catch (error) {
      console.error("Error preparing import:", error);
      toast({
        title: "Import preparation failed",
        description: "Failed to prepare file for import",
        variant: "destructive"
      });
      setIsImporting(false);
    }
  };

  const confirmImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    
    try {
      // Create a backup of current data before import
      try {
        const currentData = localStorage.getItem('portfolios');
        if (currentData) {
          const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
          localStorage.setItem(`portfolios_backup_${timestamp}`, currentData);
          console.log(`Created backup of current data at portfolios_backup_${timestamp}`);
        }
      } catch (backupError) {
        console.warn('Error creating backup before import:', backupError);
      }
      
      await importProductXML(selectedFile);
      clearPortfolioCache(); // Clear cache to force reload of new data
      setIsImportDialogOpen(false);
      
      toast({
        title: "Import Successful",
        description: "XML data has been imported successfully",
      });
      
      // Reload the page to see changes
      window.location.reload();
    } catch (error) {
      console.error("Error during import confirmation:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error during import",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Import the export function dynamically to avoid circular dependencies
      const { exportProductXML, exportAllProductsXML } = await import('../lib/xmlUtils');
      
      if (productId) {
        await exportProductXML(productId);
        toast({
          title: "Export Successful",
          description: "Product XML has been exported successfully",
        });
      } else {
        await exportAllProductsXML();
        toast({
          title: "Export Successful",
          description: "All products XML has been exported successfully",
        });
      }
    } catch (error) {
      console.error("Error during export:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export XML data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleImportClick}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        disabled={isImporting}
      >
        <Upload size={16} className={isImporting ? 'animate-pulse' : ''} />
        <span>{isImporting ? 'Importing...' : 'Import XML'}</span>
      </Button>
      
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        disabled={isExporting}
      >
        <Download size={16} className={isExporting ? 'animate-pulse' : ''} />
        <span>{isExporting ? 'Exporting...' : 'Export XML'}</span>
      </Button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xml"
        className="hidden"
      />
      
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>Confirm Import</span>
            </DialogTitle>
            <DialogDescription>
              This will replace your current product configuration. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to import this configuration?
              A backup of your current data will be created before import.
            </p>
            
            {selectedFile && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmImport}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Confirm Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataExportImport;