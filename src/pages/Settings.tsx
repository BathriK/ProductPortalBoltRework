
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO, startOfDay, endOfDay, differenceInMinutes, differenceInHours } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  userId: string;
  userRole: string;
  action: string;
  details: Record<string, any>;
}

interface LogFilter {
  startDate?: string;
  endDate?: string;
  level?: string;
  action?: string;
  userRole?: string;
  userId?: string;
  messageSearch?: string;
  minTimestamp?: string;
  maxTimestamp?: string;
  includeDetails?: boolean;
  timeRange?: 'last-hour' | 'last-24-hours' | 'last-7-days' | 'last-30-days' | 'custom';
}

const Settings: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LogFilter>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // For now, set a default role since Users table doesn't have Role column
        setUserRole('admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setError('Failed to check user role');
    }
  };

  // Mock data for demonstration since Logs table doesn't exist
  const mockLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'User logged in successfully',
      userId: 'user123',
      userRole: 'admin',
      action: 'login',
      details: { browser: 'Chrome', ip: '192.168.1.1' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      level: 'warning',
      message: 'Failed login attempt',
      userId: 'user456',
      userRole: 'user',
      action: 'login_failed',
      details: { reason: 'invalid_password', attempts: 3 }
    }
  ];

  const getHoursRange = () => {
    if (filter.timeRange === 'custom') {
      if (!filter.startDate || !filter.endDate) return 24;
      const start = parseISO(filter.startDate);
      const end = parseISO(filter.endDate);
      return differenceInHours(end, start);
    }
    switch (filter.timeRange) {
      case 'last-hour':
        return 1;
      case 'last-24-hours':
        return 24;
      case 'last-7-days':
        return 24 * 7;
      case 'last-30-days':
        return 24 * 30;
      default:
        return 24;
    }
  };

  const getMinutesRange = () => {
    if (filter.timeRange === 'custom') {
      if (!filter.startDate || !filter.endDate) return 60;
      const start = parseISO(filter.startDate);
      const end = parseISO(filter.endDate);
      return differenceInMinutes(end, start);
    }
    switch (filter.timeRange) {
      case 'last-hour':
        return 60;
      case 'last-24-hours':
        return 60 * 24;
      case 'last-7-days':
        return 60 * 24 * 7;
      case 'last-30-days':
        return 60 * 24 * 30;
      default:
        return 60;
    }
  };

  const getMostActiveHour = () => {
    if (logs.length === 0) return '-';
    
    const hourCounts = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActiveHour = Object.entries(hourCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];

    return `${mostActiveHour}:00 - ${mostActiveHour + 1}:00`;
  };

  const getMostActiveDay = () => {
    if (logs.length === 0) return '-';
    
    const dayCounts = {};
    logs.forEach(log => {
      const date = format(new Date(log.timestamp), 'yyyy-MM-dd');
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];

    return format(parseISO(mostActiveDay), 'MMM dd, yyyy');
  };

  const getPeakActivityTime = () => {
    if (logs.length === 0) return '-';
    
    const timeCounts = {};
    logs.forEach(log => {
      const time = format(new Date(log.timestamp), 'HH:mm');
      timeCounts[time] = (timeCounts[time] || 0) + 1;
    });

    const peakTime = Object.entries(timeCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];

    return `${peakTime} (${timeCounts[peakTime]} logs)`;
  };

  const loadLogs = async () => {
    if (!userRole || userRole !== 'admin') {
      setError('Only admin users can access logs');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use mock data since Logs table doesn't exist
      setLogs(mockLogs);
      setTotalPages(1);
    } catch (error) {
      console.error('Error loading logs:', error);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!userRole || userRole !== 'admin') {
      setExportError('Only admin users can export logs');
      return;
    }

    try {
      setExporting(true);
      setExportError(null);

      // Export mock data as CSV
      const csvContent = mockLogs.map(row => [
        format(parseISO(row.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        row.level,
        row.action,
        row.userId,
        row.userRole,
        row.message,
        JSON.stringify(row.details)
      ].join(','));

      const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      setExportError('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (field: keyof LogFilter, value: string) => {
    setFilter(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  };

  if (!userRole) {
    return <div>Loading...</div>;
  }

  if (userRole !== 'admin') {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>Only admin users can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">System Logs</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Time Range</label>
          <Select
            value={filter.timeRange || 'last-24-hours'}
            onValueChange={(value) => handleFilterChange('timeRange', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-hour">Last Hour</SelectItem>
              <SelectItem value="last-24-hours">Last 24 Hours</SelectItem>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Input
            type="date"
            value={filter.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            disabled={filter.timeRange !== 'custom'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <Input
            type="date"
            value={filter.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            disabled={filter.timeRange !== 'custom'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Log Level</label>
          <Select
            value={filter.level || ''}
            onValueChange={(value) => handleFilterChange('level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end mb-4 space-x-4">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={loading}
        >
          Export Logs
        </Button>
        <Button onClick={loadLogs} disabled={loading}>
          {loading ? 'Loading...' : 'Load Logs'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {exportError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{exportError}</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Log Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Logs</h3>
            <p className="text-2xl font-bold">{logs.length}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Error Logs</h3>
            <p className="text-2xl font-bold text-red-600">
              {logs.filter(log => log.level === 'error').length}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Warning Logs</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {logs.filter(log => log.level === 'warning').length}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Info Logs</h3>
            <p className="text-2xl font-bold text-green-600">
              {logs.filter(log => log.level === 'info').length}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                <TableCell className={`px-2 py-1 rounded ${
                  log.level === 'error' ? 'bg-red-100 text-red-700' :
                  log.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {log.level.toUpperCase()}
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.userId}</TableCell>
                <TableCell>{log.message}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const details = JSON.stringify(log.details, null, 2);
                      navigator.clipboard.writeText(details).then(() => {
                        alert('Log details copied to clipboard');
                      });
                    }}
                  >
                    Copy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Settings;
