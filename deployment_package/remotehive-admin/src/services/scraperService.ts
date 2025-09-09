import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export interface ManagedWebsite {
  id: string;
  name: string;
  base_url: string;
  location: string;
  country: string;
  region: string;
  is_active: boolean;
  success_rate: number;
  last_scraped_at: string | null;
  total_jobs_scraped: number;
}

export interface LocationData {
  [location: string]: ManagedWebsite[];
}

export interface WebsitesResponse {
  success: boolean;
  data: {
    websites: ManagedWebsite[];
    locations: LocationData;
    total_count: number;
  };
}

export interface ScraperConfig {
  id: string;
  source: string;
  search_query: string;
  location: string;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_interval_minutes: number;
  max_pages: number;
  created_at: string | null;
  updated_at: string | null;
}

class ScraperService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch all managed websites grouped by location
   */
  async getManagedWebsites(): Promise<WebsitesResponse> {
    try {
      const response = await this.axiosInstance.get('/scraper/websites');
      return response.data;
    } catch (error) {
      console.error('Error fetching managed websites:', error);
      throw new Error('Failed to fetch managed websites');
    }
  }

  /**
   * Fetch scraper configurations
   */
  async getScraperConfigs(): Promise<ScraperConfig[]> {
    try {
      const response = await this.axiosInstance.get('/scraper/configs');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching scraper configs:', error);
      throw new Error('Failed to fetch scraper configurations');
    }
  }

  /**
   * Start scraper for selected websites
   */
  async startScraper(config: {
    website_ids: string[];
    search_query?: string;
    max_pages?: number;
    schedule_interval?: number;
    job_type?: string;
    experience_level?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post('/scraper/start', config);
      return response.data;
    } catch (error) {
      console.error('Error starting scraper:', error);
      throw new Error('Failed to start scraper');
    }
  }

  /**
   * Stop scraper
   */
  async stopScraper(website_ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post('/scraper/stop', { website_ids });
      return response.data;
    } catch (error) {
      console.error('Error stopping scraper:', error);
      throw new Error('Failed to stop scraper');
    }
  }

  /**
   * Pause scraper
   */
  async pauseScraper(website_ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post('/scraper/pause', { website_ids });
      return response.data;
    } catch (error) {
      console.error('Error pausing scraper:', error);
      throw new Error('Failed to pause scraper');
    }
  }

  /**
   * Reset scraper configuration
   */
  async resetScraper(website_ids: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post('/scraper/reset', { website_ids });
      return response.data;
    } catch (error) {
      console.error('Error resetting scraper:', error);
      throw new Error('Failed to reset scraper');
    }
  }
}

export const scraperService = new ScraperService();
export default scraperService;