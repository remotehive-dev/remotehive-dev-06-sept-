'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  CheckCircle,
  Globe,
  MapPin,
  Search,
  Clock,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { scraperService, ManagedWebsite, LocationData } from '@/services/scraperService';
import LocationSelector from '../LocationSelector';


interface MinimalScraperConfigProps {
  onCreateConfig: (config: any) => void;
  loading?: boolean;
}



const SCRAPER_NAMES = [
  'Frontend Developer Jobs',
  'Backend Developer Jobs', 
  'Full Stack Developer Jobs',
  'DevOps Engineer Jobs',
  'Data Scientist Jobs',
  'Product Manager Jobs',
  'UI/UX Designer Jobs',
  'Mobile Developer Jobs'
];

const SEARCH_QUERIES = {
  'Remote': ['remote developer', 'remote engineer', 'remote designer', 'remote manager'],
  'San Francisco': ['developer san francisco', 'engineer sf', 'tech jobs sf'],
  'New York': ['developer nyc', 'engineer new york', 'tech jobs manhattan'],
  'London': ['developer london', 'engineer uk', 'tech jobs london'],
  'Berlin': ['developer berlin', 'engineer germany', 'tech jobs berlin'],
  'Boston': ['developer boston', 'engineer massachusetts', 'tech jobs boston'],
  'Global': ['developer', 'engineer', 'designer', 'manager']
};

const SCHEDULE_INTERVALS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
  { value: 1440, label: '24 hours' }
];

const MAX_PAGES_OPTIONS = [
  { value: 1, label: '1 page' },
  { value: 3, label: '3 pages' },
  { value: 5, label: '5 pages' },
  { value: 10, label: '10 pages' },
  { value: 20, label: '20 pages' },
  { value: 50, label: '50 pages' }
];

export function MinimalScraperConfig({ onCreateConfig, loading = false }: MinimalScraperConfigProps) {
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scheduleInterval, setScheduleInterval] = useState<number>(60);
  const [maxPages, setMaxPages] = useState<number>(5);

  const [selectAll, setSelectAll] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({});
  const [websites, setWebsites] = useState<ManagedWebsite[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const response = await scraperService.getManagedWebsites();
        if (response.success) {
          setLocationData(response.data.locations);
          setWebsites(response.data.websites);
        } else {
          toast.error('Failed to load website data');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedWebsites(websites.map(w => w.id));
    } else {
      setSelectedWebsites([]);
    }
  };

  // Handle individual website selection
  const handleWebsiteToggle = (websiteId: string, checked: boolean) => {
    if (checked) {
      setSelectedWebsites(prev => [...prev, websiteId]);
    } else {
      setSelectedWebsites(prev => prev.filter(id => id !== websiteId));
      setSelectAll(false);
    }
  };

  // Smart location selection with enhanced functionality
  const handleLocationChange = (location: string, websites: ManagedWebsite[]) => {
    setSelectedLocation(location);
    
    // Auto-select websites that support this location
    setSelectedWebsites(websites.map(website => website.id));
    
    // Pre-populate search query based on location
    const queries = SEARCH_QUERIES[location as keyof typeof SEARCH_QUERIES] || [];
    if (queries.length > 0) {
      setSearchQuery(queries[0]);
    }
    
    toast.success(`Auto-selected ${websites.length} websites for ${location}`);
  };

  // Action handlers with real API integration
  const handleStart = async () => {
    if (selectedWebsites.length === 0) {
      toast.error('Please select at least one website');
      return;
    }
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    try {
      setIsRunning(true);
      
      const config = {
          website_ids: selectedWebsites,
          search_query: searchQuery,
          max_pages: maxPages,
          schedule_interval: scheduleInterval,

        };
      
      const response = await scraperService.startScraper(config);
      
      if (response.success) {
        setIsPaused(false);
        onCreateConfig({
          websites: selectedWebsites,
          search_query: searchQuery,
          location: selectedLocation,
          schedule_interval_minutes: scheduleInterval,
          max_pages: maxPages,

        });
        toast.success('Scraper started successfully! ML-guided scraping with Gemini API integration is now active.');
      } else {
        throw new Error(response.message || 'Failed to start scraper');
      }
    } catch (error) {
      console.error('Error starting scraper:', error);
      setIsRunning(false);
      toast.error('Failed to start scraper: ' + (error as Error).message);
    }
  };

  const handleStop = async () => {
    try {
      const response = await scraperService.stopScraper(selectedWebsites);
      
      if (response.success) {
        setIsRunning(false);
        setIsPaused(false);
        toast.success('Scraper stopped successfully');
      } else {
        throw new Error(response.message || 'Failed to stop scraper');
      }
    } catch (error) {
      console.error('Error stopping scraper:', error);
      toast.error('Failed to stop scraper: ' + (error as Error).message);
    }
  };

  const handlePause = async () => {
    try {
      const response = await scraperService.pauseScraper(selectedWebsites);
      
      if (response.success) {
        setIsPaused(!isPaused);
        toast.info(isPaused ? 'Scraper resumed successfully' : 'Scraper paused successfully');
      } else {
        throw new Error(response.message || 'Failed to pause scraper');
      }
    } catch (error) {
      console.error('Error pausing scraper:', error);
      toast.error('Failed to pause scraper: ' + (error as Error).message);
    }
  };

  const handleReset = async () => {
    try {
      if (selectedWebsites.length > 0) {
        const response = await scraperService.resetScraper(selectedWebsites);
        if (!response.success) {
          throw new Error(response.message || 'Failed to reset scraper');
        }
      }
      
      setSelectedWebsites([]);
      setSelectAll(false);
      setSelectedLocation('');
      setSearchQuery('');
      setScheduleInterval(60);
      setMaxPages(5);

      setIsRunning(false);
      setIsPaused(false);
      toast.success('Configuration reset successfully');
    } catch (error) {
      console.error('Error resetting scraper:', error);
      toast.error('Failed to reset configuration: ' + (error as Error).message);
    }
  };

  // Update select all state based on individual selections
  useEffect(() => {
    setSelectAll(selectedWebsites.length === websites.length);
  }, [selectedWebsites, websites]);

  if (loadingData) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Minimal Scraper Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading website data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Minimal Scraper Configuration
        </CardTitle>
        <CardDescription>
          Enhanced with ML-guided scraping, Gemini API integration, and real-time data from {websites.length} websites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Location Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <Label className="text-base font-medium">Location (Smart Selection)</Label>
          </div>
          <LocationSelector
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Source Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <Label className="text-base font-medium">Website Sources</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select All ({websites.length})
              </Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(selectedLocation ? locationData[selectedLocation] || [] : websites).map((website) => (
              <div key={website.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={website.id}
                  checked={selectedWebsites.includes(website.id)}
                  onCheckedChange={(checked) => handleWebsiteToggle(website.id, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <Label htmlFor={website.id} className="text-sm cursor-pointer">
                    <div className="font-medium truncate">{website.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{website.base_url}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {website.location}
                      </Badge>
                      {website.success_rate > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(website.success_rate * 100)}% success
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </div>
          
          {selectedWebsites.length > 0 && (
            <Badge variant="secondary" className="w-fit">
              {selectedWebsites.length} website{selectedWebsites.length !== 1 ? 's' : ''} selected
            </Badge>
          )}
        </div>

        <Separator />



        {/* Simplified Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <Label>Search Query</Label>
            </div>
            <Select value={searchQuery} onValueChange={setSearchQuery}>
              <SelectTrigger>
                <SelectValue placeholder="Select search terms" />
              </SelectTrigger>
              <SelectContent>
                {selectedLocation && SEARCH_QUERIES[selectedLocation as keyof typeof SEARCH_QUERIES]?.map((query) => (
                  <SelectItem key={query} value={query}>{query}</SelectItem>
                )) || (
                  <SelectItem value="developer">developer</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <Label>Schedule Interval</Label>
            </div>
            <Select value={scheduleInterval.toString()} onValueChange={(value) => setScheduleInterval(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value.toString()}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <Label>Max Pages</Label>
            </div>
            <Select value={maxPages.toString()} onValueChange={(value) => setMaxPages(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAX_PAGES_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleStart} 
            disabled={loading || selectedWebsites.length === 0 || isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Start Scraper'}
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={handleStop}
            disabled={!isRunning}
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handlePause}
            disabled={!isRunning}
            className="flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Status Display */}
        {isRunning && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium">
                Scraper {isPaused ? 'Paused' : 'Running'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• {selectedWebsites.length} websites selected</p>
              <p>• Location: {selectedLocation}</p>
              <p>• Query: {searchQuery}</p>
              <p>• Interval: {scheduleInterval} minutes</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}