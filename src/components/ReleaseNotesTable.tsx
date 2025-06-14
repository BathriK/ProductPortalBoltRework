import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReleaseNote } from "@/lib/types";
import { Link } from "react-router-dom";
import { ExternalLink, Plus } from 'lucide-react';
import { formatDate } from "@/lib/utils";
import { Button } from './ui/button';
interface ReleaseNotesTableProps {
  releaseNotes: ReleaseNote[];
  productId?: string;
  showAddButton?: boolean;
}
const ReleaseNotesTable: React.FC<ReleaseNotesTableProps> = ({
  releaseNotes,
  productId,
  showAddButton = false
}) => {
  // Sort release notes by date (newest first)
  const sortedReleaseNotes = [...releaseNotes].sort((a, b) => {
    // First compare years in descending order
    if (b.year !== a.year) return b.year - a.year;
    // Then compare months in descending order
    return b.month - a.month;
  });
  const handleOpenLink = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault();
    window.open(link, "_blank", "noopener,noreferrer");
  };
  return <div>
      <div className="flex justify-between items-center mb-4">
        
        
        {showAddButton && productId && <Link to={`/products/${productId}/edit?tab=notes`}>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Plus size={16} />
              Add New Release Note
            </Button>
          </Link>}
      </div>

      <div className="rounded-md border border-[#D9E2EC]">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-sm font-medium">Period</TableHead>
              <TableHead className="text-sm font-medium">Version</TableHead>
              <TableHead className="text-sm font-medium">Updated</TableHead>
              <TableHead className="text-sm font-medium">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReleaseNotes.length > 0 ? sortedReleaseNotes.map(note => <TableRow key={note.id}>
                  <TableCell className="text-sm">{`${note.month}/${note.year}`}</TableCell>
                  <TableCell className="text-sm">{note.version}</TableCell>
                  <TableCell className="text-sm">{formatDate(note.createdAt)}</TableCell>
                  <TableCell>
                    {note.link ? <a href={note.link} onClick={e => handleOpenLink(e, note.link)} className="text-sm text-tnq-blue hover:text-tnq-navyBlue hover:underline flex items-center">
                        View Release Notes <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                      </a> : <span className="text-sm text-gray-400">No link available</span>}
                  </TableCell>
                </TableRow>) : <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-sm text-gray-500">
                  No release notes available.
                  {productId && showAddButton && <Link to={`/products/${productId}/edit?tab=notes`} className="ml-2 text-tnq-blue hover:text-tnq-navyBlue hover:underline">
                      Add Release Notes
                    </Link>}
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>;
};
export default ReleaseNotesTable;