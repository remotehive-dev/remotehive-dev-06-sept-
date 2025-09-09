'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, FilterIcon, MoreHorizontalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GlassCard } from './glass-card';
import { ANIMATION, PAGINATION } from '@/lib/constants/admin';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort: (key: string, order: 'asc' | 'desc') => void;
  };
  filtering?: {
    searchValue?: string;
    onSearch: (value: string) => void;
    filters?: Record<string, any>;
    onFilter: (filters: Record<string, any>) => void;
  };
  selection?: {
    selectedRows: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    getRowId: (row: T) => string;
  };
  actions?: TableAction<T>[];
  bulkActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: T[]) => void;
    variant?: 'default' | 'destructive' | 'secondary';
  }[];
  emptyState?: {
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  filtering,
  selection,
  actions,
  bulkActions,
  emptyState,
  className,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState(filtering?.searchValue || '');
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(filtering?.filters || {});

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    filtering?.onSearch(value);
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;
    
    if (checked) {
      const allIds = data.map(selection.getRowId);
      selection.onSelectionChange(allIds);
    } else {
      selection.onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (!selection) return;
    
    if (checked) {
      selection.onSelectionChange([...selection.selectedRows, rowId]);
    } else {
      selection.onSelectionChange(selection.selectedRows.filter(id => id !== rowId));
    }
  };

  // Calculate selection state
  const isAllSelected = selection ? selection.selectedRows.length === data.length && data.length > 0 : false;
  const isIndeterminate = selection ? selection.selectedRows.length > 0 && selection.selectedRows.length < data.length : false;
  const selectedRowsData = selection ? data.filter(row => selection.selectedRows.includes(selection.getRowId(row))) : [];

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sorting) return;
    
    const newOrder = sorting.sortBy === key && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    sorting.onSort(key, newOrder);
  };

  // Render cell content
  const renderCell = (column: Column<T>, row: T, index: number) => {
    const value = column.key.toString().includes('.') 
      ? column.key.toString().split('.').reduce((obj, key) => obj?.[key], row)
      : row[column.key as keyof T];

    if (column.render) {
      return column.render(value, row, index);
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }

    return <span className="text-gray-100">{String(value)}</span>;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          {filtering && (
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>
          )}
          
          {filtering?.filters && Object.keys(filtering.filters).length > 0 && (
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white">
              <FilterIcon className="w-4 h-4 mr-2" />
              Filters ({Object.keys(localFilters).length})
            </Button>
          )}
        </div>

        {/* Bulk actions */}
        {bulkActions && selection && selection.selectedRows.length > 0 && (
          <div className="flex gap-2">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size="sm"
                onClick={() => action.onClick(selectedRowsData)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label} ({selection.selectedRows.length})
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <GlassCard variant="elevated" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {selection && (
                  <th className="w-12 p-4">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onCheckedChange={handleSelectAll}
                      className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={cn(
                      'text-left p-4 text-sm font-semibold text-gray-300',
                      column.sortable && 'cursor-pointer hover:text-white transition-colors',
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key.toString())}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable && sorting && (
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            className={cn(
                              'w-3 h-3 transition-colors',
                              sorting.sortBy === column.key && sorting.sortOrder === 'asc'
                                ? 'text-blue-400'
                                : 'text-gray-500'
                            )}
                          />
                          <ChevronDownIcon 
                            className={cn(
                              'w-3 h-3 -mt-1 transition-colors',
                              sorting.sortBy === column.key && sorting.sortOrder === 'desc'
                                ? 'text-blue-400'
                                : 'text-gray-500'
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="w-16 p-4 text-sm font-semibold text-gray-300">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)} className="p-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        <span className="ml-3 text-gray-400">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)} className="p-8">
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">
                          {emptyState?.title || 'No data available'}
                        </div>
                        <div className="text-sm text-gray-500 mb-4">
                          {emptyState?.description || 'There are no items to display.'}
                        </div>
                        {emptyState?.action}
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((row, rowIndex) => {
                    const rowId = selection?.getRowId(row) || rowIndex.toString();
                    const isSelected = selection?.selectedRows.includes(rowId) || false;
                    
                    return (
                      <motion.tr
                        key={rowId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ ...ANIMATION.SPRING, delay: rowIndex * 0.05 }}
                        className={cn(
                          'border-b border-white/5 hover:bg-white/5 transition-colors',
                          isSelected && 'bg-blue-500/10'
                        )}
                      >
                        {selection && (
                          <td className="p-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                              className="border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                          </td>
                        )}
                        {columns.map((column, colIndex) => (
                          <td key={colIndex} className={cn('p-4', column.className)}>
                            {renderCell(column, row, rowIndex)}
                          </td>
                        ))}
                        {actions && actions.length > 0 && (
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                                >
                                  <MoreHorizontalIcon className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                {actions.map((action, actionIndex) => (
                                  <DropdownMenuItem
                                    key={actionIndex}
                                    onClick={() => action.onClick(row)}
                                    disabled={action.disabled?.(row)}
                                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                                  >
                                    {action.icon && <span className="mr-2">{action.icon}</span>}
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Show</span>
              <select
                value={pagination.limit}
                onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
              >
                {PAGINATION.PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>of {pagination.total} entries</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => {
                  const pageNum = pagination.page - 2 + i;
                  if (pageNum < 1 || pageNum > Math.ceil(pagination.total / pagination.limit)) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => pagination.onPageChange(pageNum)}
                      className={cn(
                        'w-8 h-8 p-0',
                        pageNum === pagination.page
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}