import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Employer } from '@/services/api/employers';
import { JobSeeker } from '@/services/api/jobseekers';
import { JobPost } from '@/services/api/jobposts';
import { AnalyticsData } from '@/services/api/analytics';

// Admin user interface
export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  first_name: string;
  last_name: string;
  avatar_url?: string;
  permissions: string[];
  last_login: string;
}

// Notification interface
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// Filter interfaces
export interface EmployerFilters {
  status?: string;
  industry?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface JobSeekerFilters {
  status?: string;
  experience_level?: string;
  location?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface JobPostFilters {
  status?: string;
  industry?: string;
  remote_type?: string;
  employment_type?: string;
  is_flagged?: boolean;
  is_urgent?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Admin store interface
interface AdminStore {
  // User state
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // UI state
  sidebarCollapsed: boolean;
  currentPage: string;
  theme: 'light' | 'dark' | 'system';
  
  // Data state
  employers: Employer[];
  jobSeekers: JobSeeker[];
  jobPosts: JobPost[];
  analytics: AnalyticsData | null;
  notifications: Notification[];
  
  // Filter state
  employerFilters: EmployerFilters;
  jobSeekerFilters: JobSeekerFilters;
  jobPostFilters: JobPostFilters;
  
  // Pagination state
  employerPagination: { page: number; limit: number; total: number };
  jobSeekerPagination: { page: number; limit: number; total: number };
  jobPostPagination: { page: number; limit: number; total: number };
  
  // Actions
  setUser: (user: AdminUser | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  // UI actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Data actions
  setEmployers: (employers: Employer[]) => void;
  addEmployer: (employer: Employer) => void;
  updateEmployer: (id: string, updates: Partial<Employer>) => void;
  removeEmployer: (id: string) => void;
  
  setJobSeekers: (jobSeekers: JobSeeker[]) => void;
  addJobSeeker: (jobSeeker: JobSeeker) => void;
  updateJobSeeker: (id: string, updates: Partial<JobSeeker>) => void;
  removeJobSeeker: (id: string) => void;
  
  setJobPosts: (jobPosts: JobPost[]) => void;
  addJobPost: (jobPost: JobPost) => void;
  updateJobPost: (id: string, updates: Partial<JobPost>) => void;
  removeJobPost: (id: string) => void;
  
  setAnalytics: (analytics: AnalyticsData) => void;
  
  // Notification actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  
  // Filter actions
  setEmployerFilters: (filters: Partial<EmployerFilters>) => void;
  resetEmployerFilters: () => void;
  
  setJobSeekerFilters: (filters: Partial<JobSeekerFilters>) => void;
  resetJobSeekerFilters: () => void;
  
  setJobPostFilters: (filters: Partial<JobPostFilters>) => void;
  resetJobPostFilters: () => void;
  
  // Pagination actions
  setEmployerPagination: (pagination: Partial<{ page: number; limit: number; total: number }>) => void;
  setJobSeekerPagination: (pagination: Partial<{ page: number; limit: number; total: number }>) => void;
  setJobPostPagination: (pagination: Partial<{ page: number; limit: number; total: number }>) => void;
  
  // Utility actions
  reset: () => void;
}

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  theme: 'system' as const,
  employers: [],
  jobSeekers: [],
  jobPosts: [],
  analytics: null,
  notifications: [],
  employerFilters: {},
  jobSeekerFilters: {},
  jobPostFilters: {},
  employerPagination: { page: 1, limit: 10, total: 0 },
  jobSeekerPagination: { page: 1, limit: 10, total: 0 },
  jobPostPagination: { page: 1, limit: 10, total: 0 },
};

// Create the store
export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // User actions
        setUser: (user) => set({ user }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        setLoading: (isLoading) => set({ isLoading }),
        
        // UI actions
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
        setCurrentPage: (currentPage) => set({ currentPage }),
        setTheme: (theme) => set({ theme }),
        
        // Employer actions
        setEmployers: (employers) => set({ employers }),
        addEmployer: (employer) => set((state) => ({ 
          employers: [employer, ...state.employers] 
        })),
        updateEmployer: (id, updates) => set((state) => ({
          employers: state.employers.map(emp => 
            emp.id === id ? { ...emp, ...updates } : emp
          )
        })),
        removeEmployer: (id) => set((state) => ({
          employers: state.employers.filter(emp => emp.id !== id)
        })),
        
        // Job seeker actions
        setJobSeekers: (jobSeekers) => set({ jobSeekers }),
        addJobSeeker: (jobSeeker) => set((state) => ({ 
          jobSeekers: [jobSeeker, ...state.jobSeekers] 
        })),
        updateJobSeeker: (id, updates) => set((state) => ({
          jobSeekers: state.jobSeekers.map(seeker => 
            seeker.id === id ? { ...seeker, ...updates } : seeker
          )
        })),
        removeJobSeeker: (id) => set((state) => ({
          jobSeekers: state.jobSeekers.filter(seeker => seeker.id !== id)
        })),
        
        // Job post actions
        setJobPosts: (jobPosts) => set({ jobPosts }),
        addJobPost: (jobPost) => set((state) => ({ 
          jobPosts: [jobPost, ...state.jobPosts] 
        })),
        updateJobPost: (id, updates) => set((state) => ({
          jobPosts: state.jobPosts.map(post => 
            post.id === id ? { ...post, ...updates } : post
          )
        })),
        removeJobPost: (id) => set((state) => ({
          jobPosts: state.jobPosts.filter(post => post.id !== id)
        })),
        
        // Analytics actions
        setAnalytics: (analytics) => set({ analytics }),
        
        // Notification actions
        setNotifications: (notifications) => set({ notifications }),
        addNotification: (notification) => set((state) => ({ 
          notifications: [notification, ...state.notifications] 
        })),
        markNotificationRead: (id) => set((state) => ({
          notifications: state.notifications.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        })),
        markAllNotificationsRead: () => set((state) => ({
          notifications: state.notifications.map(notif => ({ ...notif, read: true }))
        })),
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(notif => notif.id !== id)
        })),
        
        // Filter actions
        setEmployerFilters: (filters) => set((state) => ({
          employerFilters: { ...state.employerFilters, ...filters }
        })),
        resetEmployerFilters: () => set({ employerFilters: {} }),
        
        setJobSeekerFilters: (filters) => set((state) => ({
          jobSeekerFilters: { ...state.jobSeekerFilters, ...filters }
        })),
        resetJobSeekerFilters: () => set({ jobSeekerFilters: {} }),
        
        setJobPostFilters: (filters) => set((state) => ({
          jobPostFilters: { ...state.jobPostFilters, ...filters }
        })),
        resetJobPostFilters: () => set({ jobPostFilters: {} }),
        
        // Pagination actions
        setEmployerPagination: (pagination) => set((state) => ({
          employerPagination: { ...state.employerPagination, ...pagination }
        })),
        setJobSeekerPagination: (pagination) => set((state) => ({
          jobSeekerPagination: { ...state.jobSeekerPagination, ...pagination }
        })),
        setJobPostPagination: (pagination) => set((state) => ({
          jobPostPagination: { ...state.jobPostPagination, ...pagination }
        })),
        
        // Utility actions
        reset: () => set(initialState),
      }),
      {
        name: 'admin-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          employerFilters: state.employerFilters,
          jobSeekerFilters: state.jobSeekerFilters,
          jobPostFilters: state.jobPostFilters,
        }),
      }
    ),
    {
      name: 'admin-store',
    }
  )
);

// Selectors for computed values
export const useUnreadNotifications = () => {
  return useAdminStore((state) => 
    state.notifications.filter(notif => !notif.read)
  );
};

export const useUnreadNotificationCount = () => {
  return useAdminStore((state) => 
    state.notifications.filter(notif => !notif.read).length
  );
};

export const usePendingApprovals = () => {
  return useAdminStore((state) => {
    const pendingEmployers = state.employers.filter(emp => emp.status === 'pending').length;
    const pendingJobPosts = state.jobPosts.filter(post => post.status === 'pending').length;
    return pendingEmployers + pendingJobPosts;
  });
};

export const useFlaggedContent = () => {
  return useAdminStore((state) => 
    state.jobPosts.filter(post => post.is_flagged).length
  );
};

// Action creators for common operations
export const adminActions = {
  // Login action
  login: async (user: AdminUser) => {
    const { setUser, setAuthenticated, setLoading } = useAdminStore.getState();
    setLoading(true);
    try {
      setUser(user);
      setAuthenticated(true);
    } finally {
      setLoading(false);
    }
  },
  
  // Logout action
  logout: () => {
    const { reset } = useAdminStore.getState();
    reset();
  },
  
  // Bulk operations
  bulkUpdateEmployers: (ids: string[], updates: Partial<Employer>) => {
    const { updateEmployer } = useAdminStore.getState();
    ids.forEach(id => updateEmployer(id, updates));
  },
  
  bulkUpdateJobPosts: (ids: string[], updates: Partial<JobPost>) => {
    const { updateJobPost } = useAdminStore.getState();
    ids.forEach(id => updateJobPost(id, updates));
  },
  
  // Quick stats
  getQuickStats: () => {
    const state = useAdminStore.getState();
    return {
      totalEmployers: state.employers.length,
      pendingEmployers: state.employers.filter(emp => emp.status === 'pending').length,
      totalJobSeekers: state.jobSeekers.length,
      activeJobSeekers: state.jobSeekers.filter(seeker => seeker.status === 'active').length,
      totalJobPosts: state.jobPosts.length,
      pendingJobPosts: state.jobPosts.filter(post => post.status === 'pending').length,
      flaggedPosts: state.jobPosts.filter(post => post.is_flagged).length,
      unreadNotifications: state.notifications.filter(notif => !notif.read).length,
    };
  },
};