/**
 * Export utilities for data export in various formats
 */

// Export formats
export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

// Export options
export interface ExportOptions {
  filename?: string;
  headers?: string[];
  fields?: string[];
  dateFormat?: string;
  includeTimestamp?: boolean;
  customTransform?: (data: any) => any;
}

// CSV export utilities
export const exportToCSV = (data: any[], options: ExportOptions = {}): void => {
  const {
    filename = 'export',
    headers,
    fields,
    includeTimestamp = true,
  } = options;
  
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  // Get headers from first object if not provided
  const csvHeaders = headers || (fields ? fields : Object.keys(data[0]));
  
  // Transform data to CSV format
  const csvData = data.map(row => {
    return csvHeaders.map(header => {
      const value = fields ? row[fields[csvHeaders.indexOf(header)]] : row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
  });
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n');
  
  // Add BOM for UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadBlob(blob, `${filename}${includeTimestamp ? `_${getTimestamp()}` : ''}.csv`);
};

// JSON export utilities
export const exportToJSON = (data: any[], options: ExportOptions = {}): void => {
  const {
    filename = 'export',
    fields,
    includeTimestamp = true,
    customTransform,
  } = options;
  
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  // Transform data if fields are specified
  let exportData = data;
  
  if (fields) {
    exportData = data.map(row => {
      const filteredRow: any = {};
      fields.forEach(field => {
        filteredRow[field] = row[field];
      });
      return filteredRow;
    });
  }
  
  // Apply custom transformation
  if (customTransform) {
    exportData = exportData.map(customTransform);
  }
  
  // Create export object with metadata
  const exportObject = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: exportData.length,
      format: 'json',
    },
    data: exportData,
  };
  
  const jsonContent = JSON.stringify(exportObject, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  
  downloadBlob(blob, `${filename}${includeTimestamp ? `_${getTimestamp()}` : ''}.json`);
};

// Excel export utilities (requires a library like xlsx)
export const exportToExcel = async (data: any[], options: ExportOptions = {}): Promise<void> => {
  const {
    filename = 'export',
    headers,
    fields,
    includeTimestamp = true,
  } = options;
  
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  try {
    // Dynamic import to avoid bundling if not used
    const XLSX = await import('xlsx');
    
    // Prepare data
    let exportData = data;
    
    if (fields) {
      exportData = data.map(row => {
        const filteredRow: any = {};
        fields.forEach(field => {
          filteredRow[field] = row[field];
        });
        return filteredRow;
      });
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      header: headers || fields,
    });
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    downloadBlob(blob, `${filename}${includeTimestamp ? `_${getTimestamp()}` : ''}.xlsx`);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Excel export failed. Make sure xlsx library is installed.');
  }
};

// PDF export utilities (requires a library like jsPDF)
export const exportToPDF = async (
  data: any[],
  options: ExportOptions & {
    title?: string;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter' | 'legal';
  } = {}
): Promise<void> => {
  const {
    filename = 'export',
    headers,
    fields,
    includeTimestamp = true,
    title = 'Data Export',
    orientation = 'landscape',
    pageSize = 'a4',
  } = options;
  
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  try {
    // Dynamic imports to avoid bundling if not used
    const [jsPDF, autoTable] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    
    const { jsPDF: PDF } = jsPDF;
    
    // Create PDF document
    const doc = new PDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    
    // Add export date
    doc.setFontSize(10);
    doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableHeaders = headers || (fields ? fields : Object.keys(data[0]));
    const tableData = data.map(row => {
      return tableHeaders.map(header => {
        const value = fields ? row[fields[tableHeaders.indexOf(header)]] : row[header];
        
        if (value === null || value === undefined) {
          return '';
        }
        
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        
        return String(value);
      });
    });
    
    // Add table
    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Save PDF
    doc.save(`${filename}${includeTimestamp ? `_${getTimestamp()}` : ''}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('PDF export failed. Make sure jsPDF and jspdf-autotable libraries are installed.');
  }
};

// Generic export function
export const exportData = async (
  data: any[],
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<void> => {
  switch (format) {
    case 'csv':
      exportToCSV(data, options);
      break;
    case 'json':
      exportToJSON(data, options);
      break;
    case 'xlsx':
      await exportToExcel(data, options);
      break;
    case 'pdf':
      await exportToPDF(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

// Utility functions
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Data transformation utilities
export const transformers = {
  // Flatten nested objects
  flatten: (obj: any, prefix = ''): any => {
    const flattened: any = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, transformers.flatten(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  },
  
  // Format dates
  formatDates: (obj: any, format = 'YYYY-MM-DD'): any => {
    const formatted = { ...obj };
    
    Object.keys(formatted).forEach(key => {
      const value = formatted[key];
      
      if (value instanceof Date) {
        formatted[key] = formatDate(value, format);
      } else if (typeof value === 'string' && isDateString(value)) {
        formatted[key] = formatDate(new Date(value), format);
      }
    });
    
    return formatted;
  },
  
  // Remove sensitive fields
  removeSensitive: (obj: any, sensitiveFields = ['password', 'token', 'secret']): any => {
    const cleaned = { ...obj };
    
    sensitiveFields.forEach(field => {
      if (field in cleaned) {
        delete cleaned[field];
      }
    });
    
    return cleaned;
  },
  
  // Convert boolean values to strings
  booleanToString: (obj: any): any => {
    const converted = { ...obj };
    
    Object.keys(converted).forEach(key => {
      if (typeof converted[key] === 'boolean') {
        converted[key] = converted[key] ? 'Yes' : 'No';
      }
    });
    
    return converted;
  },
};

// Helper functions
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

const isDateString = (value: string): boolean => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('-');
};

// Export presets for common data types
export const exportPresets = {
  users: {
    fields: ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at'],
    headers: ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Status', 'Created Date'],
    customTransform: (user: any) => ({
      ...transformers.formatDates(user),
      ...transformers.removeSensitive(user),
    }),
  },
  
  employers: {
    fields: ['id', 'company_name', 'email', 'industry', 'status', 'premium', 'created_at'],
    headers: ['ID', 'Company Name', 'Email', 'Industry', 'Status', 'Premium', 'Created Date'],
    customTransform: (employer: any) => ({
      ...transformers.formatDates(employer),
      ...transformers.booleanToString(employer),
    }),
  },
  
  jobSeekers: {
    fields: ['id', 'email', 'first_name', 'last_name', 'experience_level', 'location', 'status', 'created_at'],
    headers: ['ID', 'Email', 'First Name', 'Last Name', 'Experience', 'Location', 'Status', 'Created Date'],
    customTransform: (jobSeeker: any) => transformers.formatDates(jobSeeker),
  },
  
  jobPosts: {
    fields: ['id', 'title', 'company_name', 'location', 'employment_type', 'remote_type', 'status', 'created_at'],
    headers: ['ID', 'Title', 'Company', 'Location', 'Employment Type', 'Remote Type', 'Status', 'Created Date'],
    customTransform: (jobPost: any) => transformers.formatDates(jobPost),
  },
  
  analytics: {
    fields: ['date', 'users', 'job_posts', 'applications', 'revenue'],
    headers: ['Date', 'Users', 'Job Posts', 'Applications', 'Revenue'],
    customTransform: (analytics: any) => ({
      ...analytics,
      revenue: analytics.revenue ? `$${analytics.revenue.toFixed(2)}` : '$0.00',
    }),
  },
};

// Bulk export utility
export const bulkExport = async (
  datasets: Array<{
    name: string;
    data: any[];
    options?: ExportOptions;
  }>,
  format: ExportFormat
): Promise<void> => {
  if (format === 'xlsx') {
    // Export multiple sheets in one Excel file
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      datasets.forEach(({ name, data, options = {} }) => {
        if (data && data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data, {
            header: options.headers || options.fields,
          });
          XLSX.utils.book_append_sheet(workbook, worksheet, name);
        }
      });
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      downloadBlob(blob, `bulk_export_${getTimestamp()}.xlsx`);
    } catch (error) {
      throw new Error('Bulk Excel export failed');
    }
  } else {
    // Export each dataset as separate files
    for (const { name, data, options = {} } of datasets) {
      if (data && data.length > 0) {
        await exportData(data, format, {
          ...options,
          filename: name,
        });
      }
    }
  }
};

// Export progress tracking
export const createExportProgress = () => {
  let progress = 0;
  let total = 0;
  const callbacks: Array<(progress: number, total: number) => void> = [];
  
  return {
    setTotal: (newTotal: number) => {
      total = newTotal;
    },
    
    increment: (amount = 1) => {
      progress += amount;
      callbacks.forEach(callback => callback(progress, total));
    },
    
    onProgress: (callback: (progress: number, total: number) => void) => {
      callbacks.push(callback);
    },
    
    getProgress: () => ({ progress, total }),
    
    reset: () => {
      progress = 0;
      total = 0;
    },
  };
};