
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Roadmap } from "@/lib/types";
import { Link } from "react-router-dom";
import { ExternalLink } from 'lucide-react';

interface RoadmapTableProps {
  roadmaps: Roadmap[];
  productId: string | undefined;
  latestRoadmap?: Roadmap | null;
}

const RoadmapTable: React.FC<RoadmapTableProps> = ({
  roadmaps,
  productId,
}) => {
  // Sort roadmaps by version (newest first)
  const sortedRoadmaps = [...roadmaps].sort((a, b) => {
    // Parse the version numbers for proper comparison
    const versionA = parseFloat(a.version);
    const versionB = parseFloat(b.version);
    return versionB - versionA;
  });

  // Get the most recent roadmap
  const latestRoadmap = sortedRoadmaps.length > 0 ? sortedRoadmaps[0] : null;

  return (
    <div>
      <div className="rounded-md border border-[#D9E2EC]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRoadmaps.length > 0 ? (
                sortedRoadmaps.map((roadmap) => (
                  <TableRow key={roadmap.id}>
                    <TableCell>{roadmap.version}</TableCell>
                    <TableCell date>{formatDate(roadmap.createdAt)}</TableCell>
                    <TableCell>
                      <a
                        href={roadmap.link || "#"}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-tnq-blue text-sm hover:text-tnq-navyBlue hover:underline flex items-center"
                      >
                        View Roadmap <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    No roadmaps available.
                    {productId && (
                      <Link
                        to={`/products/${productId}/edit?tab=roadmap`}
                        className="ml-2 text-tnq-navy hover:text-tnq-navyBlue hover:underline"
                      >
                        Add Roadmap
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default RoadmapTable;
