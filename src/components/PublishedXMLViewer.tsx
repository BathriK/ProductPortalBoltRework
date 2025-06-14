
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { getPublishedXML, listPublishedXMLs } from '../lib/xmlUtils';
import { Download, Eye, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const PublishedXMLViewer: React.FC = () => {
  const [publishedFiles, setPublishedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    // Load list of published XML files
    const files = listPublishedXMLs();
    setPublishedFiles(files);
  }, []);

  const handleViewXML = (filename: string) => {
    const content = getPublishedXML(filename);
    if (content) {
      setXmlContent(content);
      setSelectedFile(filename);
      setIsViewerOpen(true);
    }
  };

  const handleDownloadXML = (filename: string) => {
    const content = getPublishedXML(filename);
    if (content) {
      const blob = new Blob([content], { type: 'text/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const generatePublicURL = (filename: string) => {
    // For published sites, this would be the actual URL where the XML can be accessed
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/xml/${filename}`;
  };

  if (publishedFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Published XML Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            No XML files have been published yet. Use the "Publish XMLs to Site" button to make XML files available on the published site.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Published XML Files ({publishedFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {publishedFiles.map((filename) => (
              <div key={filename} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{filename}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {generatePublicURL(filename)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewXML(filename)}
                    className="flex items-center gap-1"
                  >
                    <Eye size={14} />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadXML(filename)}
                    className="flex items-center gap-1"
                  >
                    <Download size={14} />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>XML Content: {selectedFile}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            <pre className="bg-gray-50 p-4 rounded text-xs font-mono whitespace-pre-wrap">
              {xmlContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublishedXMLViewer;
