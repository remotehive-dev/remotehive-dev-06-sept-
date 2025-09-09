'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Save, X, Plus, ChevronDown, Calendar, Tag, Users, Building, MapPin, DollarSign, Clock, Star, Download, RefreshCw } from 'lucide-react';

// Types and Interfaces
interface FilterCriteria {
  id: string;
  field: string;
  operator: string;
  value: any;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
}

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  criteria: FilterCriteria[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'field' | 'value' | 'operator' | 'preset';
  category?: string;
  count?: number;
}

interface DataItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  experience: string;
  skills: string[];
  postedDate: Date;
  source: string;
  status: 'active' | 'expired' | 'filled';
  rating?: number;
  description: string;
  [key: string]: any;
}

interface AdvancedFilterSystemProps {
  data: DataItem[];
  onFilteredDataChange: (filteredData: DataItem[]) => void;
  onExport?: (data: DataItem[], format: string) => void;
  className?: string;
}

// Field Configuration
const FILTER_FIELDS = [
  { key: 'title', label: 'Job Title', type: 'text', icon: Tag },
  { key: 'company', label: 'Company', type: 'text', icon: Building },
  { key: 'location', label: 'Location', type: 'text', icon: MapPin },
  { key: 'salary', label: 'Salary', type: 'text', icon: DollarSign },
  { key: 'type', label: 'Job Type', type: 'select', icon: Users, options: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'] },
  { key: 'experience', label: 'Experience Level', type: 'select', icon: Star, options: ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'] },
  { key: 'skills', label: 'Skills', type: 'multiselect', icon: Tag },
  { key: 'postedDate', label: 'Posted Date', type: 'date', icon: Calendar },
  { key: 'source', label: 'Source', type: 'select', icon: Tag },
  { key: 'status', label: 'Status', type: 'select', icon: Tag, options: ['active', 'expired', 'filled'] },
  { key: 'rating', label: 'Rating', type: 'number', icon: Star }
];

const OPERATORS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notContains', label: 'Does not contain' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'On' },
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' },
    { value: 'between', label: 'Between' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' }
  ],
  select: [
    { value: 'equals', label: 'Is' },
    { value: 'notEquals', label: 'Is not' },
    { value: 'in', label: 'Is one of' }
  ],
  multiselect: [
    { value: 'contains', label: 'Contains' },
    { value: 'containsAll', label: 'Contains all' },
    { value: 'containsAny', label: 'Contains any' },
    { value: 'notContains', label: 'Does not contain' }
  ],
  boolean: [
    { value: 'equals', label: 'Is' }
  ]
};

export const AdvancedFilterSystem: React.FC<AdvancedFilterSystemProps> = ({
  data,
  onFilteredDataChange,
  onExport,
  className = ''
}) => {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria[]>([]);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savePresetModal, setSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetTags, setPresetTags] = useState<string[]>([]);

  // Generate mock filter presets
  useEffect(() => {
    const mockPresets: FilterPreset[] = [
      {
        id: '1',
        name: 'Senior Developer Jobs',
        description: 'High-level development positions',
        criteria: [
          { id: '1', field: 'experience', operator: 'equals', value: 'Senior', type: 'select' },
          { id: '2', field: 'type', operator: 'equals', value: 'Full-time', type: 'select' }
        ],
        isPublic: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        createdBy: 'admin',
        tags: ['development', 'senior', 'full-time']
      },
      {
        id: '2',
        name: 'Remote Opportunities',
        description: 'Jobs that offer remote work',
        criteria: [
          { id: '1', field: 'location', operator: 'contains', value: 'Remote', type: 'text' },
          { id: '2', field: 'status', operator: 'equals', value: 'active', type: 'select' }
        ],
        isPublic: true,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        createdBy: 'admin',
        tags: ['remote', 'flexible']
      },
      {
        id: '3',
        name: 'High Salary Positions',
        description: 'Jobs with competitive compensation',
        criteria: [
          { id: '1', field: 'salary', operator: 'contains', value: '$100k+', type: 'text' },
          { id: '2', field: 'experience', operator: 'in', value: ['Senior', 'Lead', 'Executive'], type: 'select' }
        ],
        isPublic: false,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        createdBy: 'user1',
        tags: ['high-salary', 'competitive']
      }
    ];
    setFilterPresets(mockPresets);
  }, []);

  // Generate search suggestions based on data and query
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query || query.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Field suggestions
    FILTER_FIELDS.forEach(field => {
      if (field.label.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `field-${field.key}`,
          text: field.label,
          type: 'field',
          category: 'Fields'
        });
      }
    });

    // Value suggestions from data
    const valueCounts: { [key: string]: number } = {};
    data.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
          const suggestionKey = `${key}:${value}`;
          valueCounts[suggestionKey] = (valueCounts[suggestionKey] || 0) + 1;
        }
      });
    });

    Object.entries(valueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([key, count]) => {
        const [field, value] = key.split(':');
        suggestions.push({
          id: `value-${key}`,
          text: value,
          type: 'value',
          category: FILTER_FIELDS.find(f => f.key === field)?.label || field,
          count
        });
      });

    // Preset suggestions
    filterPresets.forEach(preset => {
      if (preset.name.toLowerCase().includes(queryLower) || 
          preset.description?.toLowerCase().includes(queryLower) ||
          preset.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        suggestions.push({
          id: `preset-${preset.id}`,
          text: preset.name,
          type: 'preset',
          category: 'Saved Filters'
        });
      }
    });

    return suggestions.slice(0, 15);
  }, [data, filterPresets]);

  // Update suggestions when search query changes
  useEffect(() => {
    const suggestions = generateSuggestions(searchQuery);
    setSearchSuggestions(suggestions);
  }, [searchQuery, generateSuggestions]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(query)
        )
      );
    }

    // Apply filter criteria
    filterCriteria.forEach(criteria => {
      result = result.filter(item => {
        const fieldValue = item[criteria.field];
        const { operator, value } = criteria;

        switch (operator) {
          case 'contains':
            return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(value.toLowerCase());
          case 'equals':
            return fieldValue === value;
          case 'startsWith':
            return typeof fieldValue === 'string' && fieldValue.toLowerCase().startsWith(value.toLowerCase());
          case 'endsWith':
            return typeof fieldValue === 'string' && fieldValue.toLowerCase().endsWith(value.toLowerCase());
          case 'notContains':
            return typeof fieldValue === 'string' && !fieldValue.toLowerCase().includes(value.toLowerCase());
          case 'greaterThan':
            return Number(fieldValue) > Number(value);
          case 'lessThan':
            return Number(fieldValue) < Number(value);
          case 'after':
            return new Date(fieldValue) > new Date(value);
          case 'before':
            return new Date(fieldValue) < new Date(value);
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue);
          case 'containsAny':
            return Array.isArray(fieldValue) && Array.isArray(value) && 
                   value.some(v => fieldValue.includes(v));
          case 'containsAll':
            return Array.isArray(fieldValue) && Array.isArray(value) && 
                   value.every(v => fieldValue.includes(v));
          case 'last7days':
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(fieldValue) >= sevenDaysAgo;
          case 'last30days':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return new Date(fieldValue) >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    });

    return result;
  }, [data, searchQuery, filterCriteria]);

  // Notify parent component of filtered data changes
  useEffect(() => {
    onFilteredDataChange(filteredData);
  }, [filteredData, onFilteredDataChange]);

  // Filter management functions
  const addFilterCriteria = () => {
    const newCriteria: FilterCriteria = {
      id: Date.now().toString(),
      field: FILTER_FIELDS[0].key,
      operator: OPERATORS[FILTER_FIELDS[0].type][0].value,
      value: '',
      type: FILTER_FIELDS[0].type
    };
    setFilterCriteria([...filterCriteria, newCriteria]);
  };

  const updateFilterCriteria = (id: string, updates: Partial<FilterCriteria>) => {
    setFilterCriteria(prev => prev.map(criteria => 
      criteria.id === id ? { ...criteria, ...updates } : criteria
    ));
  };

  const removeFilterCriteria = (id: string) => {
    setFilterCriteria(prev => prev.filter(criteria => criteria.id !== id));
  };

  const clearAllFilters = () => {
    setFilterCriteria([]);
    setSearchQuery('');
    setActivePreset(null);
  };

  // Preset management functions
  const applyPreset = (preset: FilterPreset) => {
    setFilterCriteria(preset.criteria);
    setActivePreset(preset.id);
    setSearchQuery('');
  };

  const saveCurrentAsPreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      description: presetDescription,
      criteria: [...filterCriteria],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      tags: presetTags
    };

    setFilterPresets(prev => [...prev, newPreset]);
    setSavePresetModal(false);
    setPresetName('');
    setPresetDescription('');
    setPresetTags([]);
  };

  const deletePreset = (presetId: string) => {
    setFilterPresets(prev => prev.filter(p => p.id !== presetId));
    if (activePreset === presetId) {
      setActivePreset(null);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'preset') {
      const preset = filterPresets.find(p => p.id === suggestion.id.replace('preset-', ''));
      if (preset) {
        applyPreset(preset);
      }
    } else if (suggestion.type === 'value') {
      setSearchQuery(suggestion.text);
    } else if (suggestion.type === 'field') {
      const field = FILTER_FIELDS.find(f => f.label === suggestion.text);
      if (field) {
        addFilterCriteria();
        setShowAdvancedFilters(true);
      }
    }
    setShowSuggestions(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Advanced Filter System</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              Advanced Filters
            </button>
            {onExport && (
              <button
                onClick={() => onExport(filteredData, 'csv')}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs, companies, skills, or use saved filters..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchSuggestions.reduce((acc, suggestion) => {
                const category = suggestion.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(suggestion);
                return acc;
              }, {} as { [key: string]: SearchSuggestion[] })
              }
              {Object.entries(
                searchSuggestions.reduce((acc, suggestion) => {
                  const category = suggestion.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(suggestion);
                  return acc;
                }, {} as { [key: string]: SearchSuggestion[] })
              ).map(([category, suggestions]) => (
                <div key={category}>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                    {category}
                  </div>
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900">{suggestion.text}</span>
                      {suggestion.count && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {suggestion.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredData.length.toLocaleString()} of {data.length.toLocaleString()} results
          </span>
          {(filterCriteria.length > 0 || searchQuery) && (
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          {/* Filter Presets */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Saved Filter Presets</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {filterPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    activePreset === preset.id
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {preset.name}
                  {!preset.isPublic && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>
              ))}
              {filterCriteria.length > 0 && (
                <button
                  onClick={() => setSavePresetModal(true)}
                  className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <Save className="w-3 h-3 mr-1 inline" />
                  Save Current
                </button>
              )}
            </div>
          </div>

          {/* Filter Criteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Filter Criteria</h3>
              <button
                onClick={addFilterCriteria}
                className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1 inline" />
                Add Filter
              </button>
            </div>

            {filterCriteria.map((criteria, index) => {
              const field = FILTER_FIELDS.find(f => f.key === criteria.field);
              const operators = OPERATORS[criteria.type] || [];

              return (
                <div key={criteria.id} className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  {index > 0 && (
                    <span className="text-sm font-medium text-gray-500">AND</span>
                  )}

                  {/* Field Selection */}
                  <select
                    value={criteria.field}
                    onChange={(e) => {
                      const newField = FILTER_FIELDS.find(f => f.key === e.target.value);
                      if (newField) {
                        updateFilterCriteria(criteria.id, {
                          field: e.target.value,
                          type: newField.type,
                          operator: OPERATORS[newField.type][0].value,
                          value: ''
                        });
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {FILTER_FIELDS.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator Selection */}
                  <select
                    value={criteria.operator}
                    onChange={(e) => updateFilterCriteria(criteria.id, { operator: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {criteria.type === 'select' && field?.options ? (
                    <select
                      value={criteria.value}
                      onChange={(e) => updateFilterCriteria(criteria.id, { value: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      {field.options.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : criteria.type === 'date' ? (
                    <input
                      type="date"
                      value={criteria.value}
                      onChange={(e) => updateFilterCriteria(criteria.id, { value: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : criteria.type === 'number' ? (
                    <input
                      type="number"
                      value={criteria.value}
                      onChange={(e) => updateFilterCriteria(criteria.id, { value: e.target.value })}
                      placeholder="Enter number"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type="text"
                      value={criteria.value}
                      onChange={(e) => updateFilterCriteria(criteria.id, { value: e.target.value })}
                      placeholder="Enter value"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {/* Remove Filter */}
                  <button
                    onClick={() => removeFilterCriteria(criteria.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {filterCriteria.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No filters applied. Click "Add Filter" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {savePresetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Filter Preset</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Enter preset name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSavePresetModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentAsPreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default AdvancedFilterSystem;