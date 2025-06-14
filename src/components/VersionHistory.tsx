import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import { History } from 'lucide-react';
import { Badge } from './ui/badge';

interface HistoryItem {
  id: string;
  version: number;
  createdAt: string;
}

interface VersionHistoryProps {
  items: HistoryItem[];
  onSelect: (id: string) => void;
  currentId: string;
  onCreateNew?: () => void;
  hideNewVersion?: boolean;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ 
  items = [],
  onSelect,
  currentId,
  onCreateNew,
  hideNewVersion = true // Changed default to true to hide new version button
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentId);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Keep local state in sync with parent
  useEffect(() => {
    setSelectedId(currentId);
  }, [currentId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect(id);
    setDropdownOpen(false);
  };

  const currentVersion = items.find(item => item.id === selectedId)?.version || 'Latest';

  return (
    <div className="flex items-center space-x-1">
      {items.length > 0 && (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <History className="h-3.5 w-3.5" />
              <span>v{currentVersion}</span>
              <Badge variant="outline" className="ml-1 text-xs">
                {items.length} version{items.length !== 1 ? 's' : ''}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {items
              .sort((a, b) => b.version - a.version)
              .map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex justify-between ${item.id === selectedId ? 'bg-muted' : ''}`}
                >
                  <span>Version {item.version}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(item.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* New Version button is now hidden by default */}
      {onCreateNew && !hideNewVersion && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateNew}
          className="flex items-center gap-1"
        >
          <span>New Version</span>
        </Button>
      )}
    </div>
  );
};

export default VersionHistory;