'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Play, 
  Square, 
  ChevronUp, 
  ChevronDown, 
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ScraperConfig {
  id: string;
  source: string;
  scraper_name: string;
  search_query: string;
  location: string;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_interval_minutes: number;
  max_pages: number;
  created_at: string;
  updated_at: string;
}

interface ScraperStatus {
  id: string;
  source: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  jobs_found: number;
  current_page: number;
  total_pages: number;
  started_at?: string;
  estimated_completion?: string;
  error_message?: string;
}

interface EnhancedConfigurationTableProps {
  configs: ScraperConfig[];
  statuses: ScraperStatus[];
  onRunScraper: (id: string) => void;
  onStopScraper: (id: string) => void;
  loading?: boolean;
  onEditConfig?: (config: ScraperConfig) => void;
  onDeleteConfig?: (id: string) => void;
}

type SortField = 'scraper_name' | 'source' | 'location' | 'created_at' | 'is_active';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [20, 50, 100];
const REGIONS = ['All Regions', 'Remote', 'North America', 'Europe', 'Asia', 'Australia', 'South America', 'Africa'];

export function EnhancedConfigurationTable({
  configs,
  statuses,
  onRunScraper,
  onStopScraper,
  loading = false,
  onEditConfig,
  onDeleteConfig
}: EnhancedConfigurationTableProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filtering state
  const [globalSearch, setGlobalSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [urlSearch, setUrlSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [showFilters, setShowFilters] = useState(false);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Filter and sort data
  const filteredAndSortedConfigs = useMemo(() => {
    let filtered = configs.filter(config => {
      // Global search
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        const matchesGlobal = 
          config.scraper_name.toLowerCase().includes(searchLower) ||
          config.source.toLowerCase().includes(searchLower) ||
          config.search_query.toLowerCase().includes(searchLower) ||
          config.location.toLowerCase().includes(searchLower);
        if (!matchesGlobal) return false;
      }

      // Name search
      if (nameSearch && !config.scraper_name.toLowerCase().includes(nameSearch.toLowerCase())) {
        return false;
      }

      // URL/Source search
      if (urlSearch && !config.source.toLowerCase().includes(urlSearch.toLowerCase())) {
        return false;
      }

      // Region filter
      if (selectedRegion !== 'All Regions') {
        if (selectedRegion === 'Remote' && !config.location.toLowerCase().includes('remote')) {
          return false;
        } else if (selectedRegion !== 'Remote' && !config.location.toLowerCase().includes(selectedRegion.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle different data types
      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'is_active') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [configs, globalSearch, nameSearch, urlSearch, selectedRegion, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedConfigs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedConfigs = filteredAndSortedConfigs.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [globalSearch, nameSearch, urlSearch, selectedRegion]);

  const getStatusBadge = (config: ScraperConfig) => {
    const status = statuses.find(s => s.source === config.source);
    if (status) {
      const variant = status.status === 'running' ? 'default' : 
                    status.status === 'completed' ? 'secondary' : 
                    status.status === 'failed' ? 'destructive' : 'outline';
      return <Badge variant={variant}>{status.status}</Badge>;
    }
    return <Badge variant={config.is_active ? 'default' : 'secondary'}>
      {config.is_active ? 'Active' : 'Inactive'}
    </Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Scraper Configurations</CardTitle>
            <CardDescription>
              Manage your scraper configurations with advanced filtering and sorting
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Global Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all fields..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Website Name</label>
              <Input
                placeholder="Filter by name..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Source/URL</label>
              <Input
                placeholder="Filter by source..."
                value={urlSearch}
                onChange={(e) => setUrlSearch(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedConfigs.length)} of {filteredAndSortedConfigs.length} configurations
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('scraper_name')}
                >
                  <div className="flex items-center">
                    Name
                    {getSortIcon('scraper_name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('source')}
                >
                  <div className="flex items-center">
                    Source
                    {getSortIcon('source')}
                  </div>
                </TableHead>
                <TableHead>Query</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center">
                    Location
                    {getSortIcon('location')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('is_active')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('is_active')}
                  </div>
                </TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Created
                    {getSortIcon('created_at')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No configurations found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedConfigs.map((config) => {
                  const status = statuses.find(s => s.source === config.source);
                  const isRunning = status?.status === 'running';
                  
                  return (
                    <TableRow key={config.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {config.scraper_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{config.source}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={config.search_query}>
                        {config.search_query}
                      </TableCell>
                      <TableCell>{config.location || 'Any'}</TableCell>
                      <TableCell>
                        {getStatusBadge(config)}
                      </TableCell>
                      <TableCell>
                        {config.schedule_enabled ? (
                          <span className="text-sm text-muted-foreground">
                            Every {config.schedule_interval_minutes}m
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(config.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant={isRunning ? "destructive" : "default"}
                            onClick={() => isRunning ? (status && onStopScraper(status.id)) : onRunScraper(config.id)}
                            disabled={loading}
                          >
                            {isRunning ? (
                              <><Square className="w-4 h-4 mr-1" />Stop</>
                            ) : (
                              <><Play className="w-4 h-4 mr-1" />Run</>
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onEditConfig && (
                                <DropdownMenuItem onClick={() => onEditConfig(config)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {onDeleteConfig && (
                                <DropdownMenuItem 
                                  onClick={() => onDeleteConfig(config.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {getPageNumbers().map(pageNum => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}