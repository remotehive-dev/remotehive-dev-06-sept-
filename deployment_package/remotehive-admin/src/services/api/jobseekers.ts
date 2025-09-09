import { SupabaseService, TABLES, STATUS_TYPES } from './supabase';

export interface JobSeeker {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location: string;
  bio?: string;
  skills: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  job_preferences: {
    remote_preference: 'remote' | 'hybrid' | 'onsite' | 'flexible';
    salary_expectation?: {
      min: number;
      max: number;
      currency: string;
    };
    preferred_industries: string[];
    preferred_roles: string[];
  };
  resume_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  is_premium: boolean;
  profile_completion: number;
  last_active: string;
  created_at: string;
  updated_at: string;
  total_applications?: number;
  successful_applications?: number;
}

export interface JobSeekerStats {
  total: number;
  active: number;
  inactive: number;
  premium: number;
  new_this_month: number;
  high_performers: number;
}

export class JobSeekerService {
  // Get all job seekers with pagination and filters
  static async getJobSeekers(options: {
    page?: number;
    limit?: number;
    status?: string;
    experience_level?: string;
    location?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ jobSeekers: JobSeeker[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      experience_level,
      location,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const filters: Record<string, any> = {};

    if (status) filters.status = status;
    if (experience_level) filters.experience_level = experience_level;
    if (location) filters.location = location;

    let jobSeekers: JobSeeker[];

    if (search) {
      jobSeekers = await SupabaseService.search<JobSeeker>(
        TABLES.JOB_SEEKERS,
        search,
        ['first_name', 'last_name', 'email', 'location', 'skills'],
        {
          select: `
            *,
            total_applications:applications(count),
            successful_applications:applications(count).eq(status,hired)
          `,
          filters,
          limit
        }
      );
    } else {
      jobSeekers = await SupabaseService.read<JobSeeker>(
        TABLES.JOB_SEEKERS,
        {
          select: `
            *,
            total_applications:applications(count),
            successful_applications:applications(count).eq(status,hired)
          `,
          filters,
          orderBy: { column: sortBy, ascending: sortOrder === 'asc' },
          limit,
          offset
        }
      );
    }

    const total = await SupabaseService.count(TABLES.JOB_SEEKERS, filters);

    return { jobSeekers, total };
  }

  // Get job seeker by ID
  static async getJobSeekerById(id: string): Promise<JobSeeker> {
    const jobSeekers = await SupabaseService.read<JobSeeker>(
      TABLES.JOB_SEEKERS,
      {
        select: `
          *,
          total_applications:applications(count),
          successful_applications:applications(count).eq(status,hired),
          user:users(*)
        `,
        filters: { id }
      }
    );

    if (!jobSeekers.length) {
      throw new Error('Job seeker not found');
    }

    return jobSeekers[0];
  }

  // Get job seeker statistics
  static async getJobSeekerStats(): Promise<JobSeekerStats> {
    const [total, active, inactive, premium] = await Promise.all([
      SupabaseService.count(TABLES.JOB_SEEKERS),
      SupabaseService.count(TABLES.JOB_SEEKERS, { status: STATUS_TYPES.ACTIVE }),
      SupabaseService.count(TABLES.JOB_SEEKERS, { status: STATUS_TYPES.INACTIVE }),
      SupabaseService.count(TABLES.JOB_SEEKERS, { is_premium: true })
    ]);

    // Get new job seekers this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const new_this_month = await SupabaseService.count(TABLES.JOB_SEEKERS, {
      created_at: `gte.${thisMonth.toISOString()}`
    });

    // Get high performers (profile completion > 80% and active)
    const high_performers = await SupabaseService.count(TABLES.JOB_SEEKERS, {
      status: STATUS_TYPES.ACTIVE,
      profile_completion: 'gte.80'
    });

    return {
      total,
      active,
      inactive,
      premium,
      new_this_month,
      high_performers
    };
  }

  // Update job seeker
  static async updateJobSeeker(
    id: string,
    data: Partial<JobSeeker>
  ): Promise<JobSeeker> {
    return await SupabaseService.update<JobSeeker>(
      TABLES.JOB_SEEKERS,
      id,
      {
        ...data,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Toggle premium status
  static async togglePremium(id: string, isPremium: boolean): Promise<JobSeeker> {
    return await SupabaseService.update<JobSeeker>(
      TABLES.JOB_SEEKERS,
      id,
      {
        is_premium: isPremium,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Suspend job seeker
  static async suspendJobSeeker(id: string): Promise<JobSeeker> {
    return await SupabaseService.update<JobSeeker>(
      TABLES.JOB_SEEKERS,
      id,
      {
        status: 'suspended',
        updated_at: new Date().toISOString()
      }
    );
  }

  // Activate job seeker
  static async activateJobSeeker(id: string): Promise<JobSeeker> {
    return await SupabaseService.update<JobSeeker>(
      TABLES.JOB_SEEKERS,
      id,
      {
        status: STATUS_TYPES.ACTIVE,
        updated_at: new Date().toISOString()
      }
    );
  }

  // Delete job seeker
  static async deleteJobSeeker(id: string): Promise<void> {
    await SupabaseService.delete(TABLES.JOB_SEEKERS, id);
  }

  // Get top performing job seekers
  static async getTopPerformers(limit: number = 10): Promise<JobSeeker[]> {
    return await SupabaseService.read<JobSeeker>(
      TABLES.JOB_SEEKERS,
      {
        select: `
          *,
          total_applications:applications(count),
          successful_applications:applications(count).eq(status,hired)
        `,
        filters: { status: STATUS_TYPES.ACTIVE },
        orderBy: { column: 'profile_completion', ascending: false },
        limit
      }
    );
  }

  // Get job seekers by experience level
  static async getJobSeekersByExperience(): Promise<Record<string, number>> {
    const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
    const counts: Record<string, number> = {};

    for (const level of experienceLevels) {
      counts[level] = await SupabaseService.count(TABLES.JOB_SEEKERS, {
        experience_level: level,
        status: STATUS_TYPES.ACTIVE
      });
    }

    return counts;
  }

  // Get job seekers by location
  static async getJobSeekersByLocation(limit: number = 10): Promise<Record<string, number>> {
    const { data, error } = await SupabaseService.read<{ location: string }>(
      TABLES.JOB_SEEKERS,
      {
        select: 'location',
        filters: { status: STATUS_TYPES.ACTIVE }
      }
    );

    if (error) throw error;

    const locationCounts: Record<string, number> = {};
    data.forEach(item => {
      if (item.location) {
        locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
      }
    });

    // Sort by count and return top locations
    const sortedLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .reduce((obj, [location, count]) => {
        obj[location] = count;
        return obj;
      }, {} as Record<string, number>);

    return sortedLocations;
  }

  // Get recent job seeker activity
  static async getRecentActivity(limit: number = 10): Promise<JobSeeker[]> {
    return await SupabaseService.read<JobSeeker>(
      TABLES.JOB_SEEKERS,
      {
        select: 'id, first_name, last_name, last_active, created_at',
        orderBy: { column: 'last_active', ascending: false },
        limit
      }
    );
  }

  // Search job seekers by skills
  static async searchBySkills(skills: string[]): Promise<JobSeeker[]> {
    const { data, error } = await SupabaseService.read<JobSeeker>(
      TABLES.JOB_SEEKERS,
      {
        select: '*',
        filters: { status: STATUS_TYPES.ACTIVE }
      }
    );

    if (error) throw error;

    // Filter by skills (this would be better done with a proper full-text search)
    const filteredJobSeekers = data.filter(jobSeeker => {
      return skills.some(skill => 
        jobSeeker.skills.some(js => 
          js.toLowerCase().includes(skill.toLowerCase())
        )
      );
    });

    return filteredJobSeekers;
  }
}