'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, MapPin, Globe } from 'lucide-react';
import { scraperService, type LocationData, type ManagedWebsite } from '../services/scraperService';

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationChange: (location: string, websites: ManagedWebsite[]) => void;
  className?: string;
}

interface LocationOption {
  value: string;
  label: string;
  count: number;
  websites: ManagedWebsite[];
  country?: string;
  region?: string;
}

export default function LocationSelector({ 
  selectedLocation, 
  onLocationChange, 
  className = '' 
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<LocationData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch location data on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await scraperService.getManagedWebsites();
        
        if (response.success) {
          setLocations(response.data.locations);
        } else {
          setError('Failed to fetch location data');
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Unable to connect to scraper service');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Process locations into options with counts
  const locationOptions = useMemo(() => {
    const options: LocationOption[] = [];
    
    Object.entries(locations).forEach(([location, websites]) => {
      if (websites && websites.length > 0) {
        // Parse location string to extract country and region
        const parts = location.split(' ').filter(part => part.trim());
        const country = parts[0] || '';
        const region = parts.slice(1).join(' ') || '';
        
        options.push({
          value: location,
          label: location === 'Global' ? 'Global (All Regions)' : location,
          count: websites.length,
          websites: websites,
          country: country !== 'Global' ? country : undefined,
          region: region || undefined
        });
      }
    });
    
    // Sort by count (descending) then by name
    return options.sort((a, b) => {
      if (a.value === 'Global') return -1;
      if (b.value === 'Global') return 1;
      if (a.count !== b.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
  }, [locations]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return locationOptions;
    
    return locationOptions.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locationOptions, searchTerm]);

  const selectedOption = locationOptions.find(opt => opt.value === selectedLocation);

  const handleLocationSelect = (option: LocationOption) => {
    onLocationChange(option.value, option.websites);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-300 rounded w-32"></div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50">
          <div className="flex items-center text-red-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {selectedOption?.value === 'Global' ? (
              <Globe className="h-4 w-4 text-blue-500 mr-2" />
            ) : (
              <MapPin className="h-4 w-4 text-gray-500 mr-2" />
            )}
            <span className="text-gray-900">
              {selectedOption ? selectedOption.label : 'Select location...'}
            </span>
            {selectedOption && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {selectedOption.count} {selectedOption.count === 1 ? 'website' : 'websites'}
              </span>
            )}
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchTerm ? 'No locations found' : 'No locations available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleLocationSelect(option)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                    selectedLocation === option.value ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {option.value === 'Global' ? (
                        <Globe className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                      ) : (
                        <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {option.label}
                        </div>
                        {option.country && option.region && (
                          <div className="text-xs text-gray-500">
                            {option.country} • {option.region}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {option.count}
                      </span>
                      {selectedLocation === option.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
}