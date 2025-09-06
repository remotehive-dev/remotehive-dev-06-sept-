'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  FileText,
  Search,
  DollarSign,
  Star,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Upload,
  Image as ImageIcon,
  Code,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  BarChart3,
  Target,
  TrendingUp,
  Users,
  MousePointer,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { websiteManagerApi } from '@/lib/supabase';
import { useRetry, retryConditions } from '@/hooks/useRetry';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Sample data for demonstration
const samplePages = [
  {
    id: 1,
    title: 'Home Page',
    slug: '/',
    status: 'published',
    lastModified: '2024-01-15T10:30:00Z',
    views: 15420,
    type: 'page'
  },
  {
    id: 2,
    title: 'About Us',
    slug: '/about',
    status: 'published',
    lastModified: '2024-01-14T15:45:00Z',
    views: 8930,
    type: 'page'
  },
  {
    id: 3,
    title: 'Pricing Plans',
    slug: '/pricing',
    status: 'draft',
    lastModified: '2024-01-16T09:15:00Z',
    views: 0,
    type: 'page'
  }
];

const sampleReviews = [
  {
    id: 1,
    author: 'John Smith',
    rating: 5,
    content: 'Amazing platform! Found my dream remote job within a week.',
    status: 'approved',
    date: '2024-01-15T10:30:00Z',
    featured: true
  },
  {
    id: 2,
    author: 'Sarah Johnson',
    rating: 4,
    content: 'Great selection of remote opportunities. User-friendly interface.',
    status: 'pending',
    date: '2024-01-16T14:20:00Z',
    featured: false
  }
];

const sampleAds = [
  {
    id: 1,
    name: 'Google AdSense - Header',
    type: 'google_adsense',
    position: 'header',
    status: 'active',
    revenue: 245.67,
    clicks: 1250,
    impressions: 45000
  },
  {
    id: 2,
    name: 'Meta Ads - Sidebar',
    type: 'meta_ads',
    position: 'sidebar',
    status: 'active',
    revenue: 189.34,
    clicks: 890,
    impressions: 32000
  }
];

export default function WebsiteManagerPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [pages, setPages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [initialLoading, setInitialLoading] = useState(true);

  // SEO Settings State
  const [seoSettings, setSeoSettings] = useState({
    siteTitle: 'RemoteHive - Find Your Perfect Remote Job',
    metaDescription: 'Discover thousands of remote job opportunities from top companies worldwide. Join RemoteHive today and work from anywhere.',
    keywords: 'remote jobs, work from home, remote work, telecommute, digital nomad',
    ogImage: '/og-image.jpg',
    twitterCard: 'summary_large_image',
    canonicalUrl: 'https://remotehive.com',
    robotsTxt: 'User-agent: *\nAllow: /',
    sitemapEnabled: true,
    analyticsId: 'GA-XXXXXXXXX',
    searchConsoleId: 'SC-XXXXXXXXX'
  });

  // Content Editor State
  const [contentEditor, setContentEditor] = useState({
    title: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    featuredImage: '',
    status: 'draft',
    publishDate: new Date().toISOString().split('T')[0]
  });

  // Theme Settings State
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#2563eb',
    secondaryColor: '#4b5563'
  });

  // Sample data for fallback
   const samplePages = [
     {
       id: '1',
       title: 'Home Page',
       slug: 'home',
       status: 'published',
       lastModified: '2024-01-15',
       views: 1250,
       content: 'Welcome to RemoteHive - Your gateway to remote opportunities'
     },
     {
       id: '2',
       title: 'About Us',
       slug: 'about',
       status: 'published',
       lastModified: '2024-01-14',
       views: 890,
       content: 'Learn more about our mission and values'
     },
     {
       id: '3',
       title: 'Pricing',
       slug: 'pricing',
       status: 'draft',
       lastModified: '2024-01-13',
       views: 0,
       content: 'Flexible pricing plans for all needs'
     }
   ];

   const sampleReviews = [
     {
       id: '1',
       author: 'Sarah Johnson',
       rating: 5,
       content: 'Amazing platform! Found my dream remote job within a week.',
       status: 'approved',
       date: '2024-01-15',
       featured: true
     },
     {
       id: '2',
       author: 'Mike Chen',
       rating: 4,
       content: 'Great selection of remote opportunities. Highly recommended!',
       status: 'pending',
       date: '2024-01-14',
       featured: false
     }
   ];

   const sampleAds = [
     {
       id: '1',
       name: 'Google Ads Campaign',
       platform: 'Google Ads',
       status: 'active',
       budget: '$500/month',
       performance: '+15% CTR'
     },
     {
       id: '2',
       name: 'Meta Ads Campaign',
       platform: 'Meta',
       status: 'paused',
       budget: '$300/month',
       performance: '+8% CTR'
     }
   ];

   // Load initial data
   useEffect(() => {
     loadInitialData();
   }, []);
 
   const loadInitialData = async () => {
     try {
       setInitialLoading(true);
       
       // Try to load real data, fallback to sample data if APIs are not available
       try {
         const [pagesData, reviewsData, adsData, seoData] = await Promise.all([
           websiteManagerApi.getPages().catch(() => samplePages),
           websiteManagerApi.getReviews().catch(() => sampleReviews),
           websiteManagerApi.getAds().catch(() => sampleAds),
           websiteManagerApi.getSeoSettings().catch(() => seoSettings)
         ]);
         
         setPages(Array.isArray(pagesData) ? pagesData : samplePages);
         setReviews(Array.isArray(reviewsData) ? reviewsData : sampleReviews);
         setAds(Array.isArray(adsData) ? adsData : sampleAds);
         if (seoData && typeof seoData === 'object') {
           setSeoSettings(seoData);
         }
       } catch (error) {
         console.log('Using sample data as APIs are not available yet');
         setPages(samplePages);
         setReviews(sampleReviews);
         setAds(sampleAds);
       }
     } catch (error) {
       console.error('Failed to load initial data:', error);
       // Use sample data as fallback
       setPages(samplePages);
       setReviews(sampleReviews);
       setAds(sampleAds);
     } finally {
       setInitialLoading(false);
     }
   };

  const handleSavePage = async () => {
    setLoading(true);
    try {
      const pageData = {
        ...contentEditor,
        lastModified: new Date().toISOString()
      };
      
      let savedPage;
      if (selectedPage) {
        savedPage = await websiteManagerApi.updatePage(selectedPage.id, pageData);
        setPages(pages.map(page => page.id === selectedPage.id ? savedPage : page));
      } else {
        savedPage = await websiteManagerApi.createPage(pageData);
        setPages([...pages, savedPage]);
      }
      
      toast.success('Page saved successfully!');
      setIsEditDialogOpen(false);
      setSelectedPage(null);
      setContentEditor({
        title: '',
        slug: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        featuredImage: '',
        status: 'draft',
        publishDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('Failed to save page');
    } finally {
      setLoading(false);
    }
  };

  // API function for deleting page
  const deletePageApi = async (pageId) => {
    await websiteManagerApi.deletePage(pageId);
  };

  // Configure retry for deleting page
  const deletePageRetry = useRetry(deletePageApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying delete page (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for delete page:', error);
      toast.error('Failed to delete page after multiple attempts');
    }
  });

  const handleDeletePage = async (pageId) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    setLoading(true);
    try {
      await deletePageRetry.execute(pageId);
      setPages(pages.filter(page => page.id !== pageId));
      toast.success('Page deleted successfully!');
    } catch (error) {
      console.error('Error deleting page:', error);
      // Error handling is done in the retry configuration
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reviewId, action) => {
    setLoading(true);
    try {
      const updatedReview = await websiteManagerApi.updateReview(reviewId, { status: action });
      setReviews(reviews.map(review => 
        review.id === reviewId ? updatedReview : review
      ));
      toast.success(`Review ${action} successfully!`);
    } catch (error) {
      console.error(`Failed to ${action} review:`, error);
      toast.error(`Failed to ${action} review`);
    } finally {
      setLoading(false);
    }
  };

  // API function for updating SEO settings
  const updateSeoSettingsApi = async (newSettings) => {
    return await websiteManagerApi.updateSeoSettings(newSettings);
  };

  // Configure retry for updating SEO settings
  const updateSeoRetry = useRetry(updateSeoSettingsApi, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: retryConditions.all,
    onRetry: (attempt, error) => {
      console.log(`Retrying update SEO settings (attempt ${attempt}):`, error.message);
      toast.info(`Retrying... (${attempt}/3)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max retry attempts reached for update SEO settings:', error);
      toast.error('Failed to update SEO settings after multiple attempts');
    }
  });

  const handleSeoSettingsUpdate = async (newSettings) => {
    setLoading(true);
    try {
      const updatedSettings = await updateSeoRetry.execute(newSettings);
      setSeoSettings(updatedSettings);
      toast.success('SEO settings updated successfully!');
    } catch (error) {
      console.error('Error updating SEO settings:', error);
      // Error handling is done in the retry configuration
    } finally {
      setLoading(false);
    }
  };

  const handleEditPage = (page) => {
    setSelectedPage(page);
    setContentEditor({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      featuredImage: page.featuredImage || '',
      status: page.status,
      publishDate: page.publishDate || new Date().toISOString().split('T')[0]
    });
    setIsEditDialogOpen(true);
  };

  const StatCard = ({ title, value, description, icon: Icon, color = 'blue', trend }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading website data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Website Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete control over your website content, SEO, and monetization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview Site
          </Button>
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pages"
          value={pages.length}
          description="Published pages"
          icon={FileText}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Monthly Views"
          value="124.5K"
          description="Page views this month"
          icon={Eye}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="SEO Score"
          value="92/100"
          description="Overall SEO health"
          icon={Search}
          color="purple"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Ad Revenue"
          value="$435.01"
          description="This month's earnings"
          icon={DollarSign}
          color="yellow"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Content</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>SEO</span>
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Ads</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Design</span>
          </TabsTrigger>
        </TabsList>

        {/* Content Management Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Content Management</h2>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create/Edit Page</DialogTitle>
                  <DialogDescription>
                    Create or edit website pages with full content control
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Page Title</Label>
                      <Input
                        id="title"
                        value={contentEditor.title}
                        onChange={(e) => setContentEditor({...contentEditor, title: e.target.value})}
                        placeholder="Enter page title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={contentEditor.slug}
                        onChange={(e) => setContentEditor({...contentEditor, slug: e.target.value})}
                        placeholder="/page-url"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Page Content</Label>
                    <Textarea
                      id="content"
                      value={contentEditor.content}
                      onChange={(e) => setContentEditor({...contentEditor, content: e.target.value})}
                      placeholder="Enter page content (HTML supported)"
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={contentEditor.metaTitle}
                        onChange={(e) => setContentEditor({...contentEditor, metaTitle: e.target.value})}
                        placeholder="SEO title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={contentEditor.status} onValueChange={(value) => setContentEditor({...contentEditor, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={contentEditor.metaDescription}
                      onChange={(e) => setContentEditor({...contentEditor, metaDescription: e.target.value})}
                      placeholder="SEO description"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePage} disabled={loading}>
                    {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    Save Page
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Website Pages</CardTitle>
              <CardDescription>
                Manage all your website pages and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell className="text-blue-600">{page.slug}</TableCell>
                      <TableCell>
                        <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                          {page.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{page.views.toLocaleString()}</TableCell>
                      <TableCell>{new Date(page.lastModified).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPage(page)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeletePage(page.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Management Tab */}
        <TabsContent value="seo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Global SEO Settings</CardTitle>
                <CardDescription>
                  Configure site-wide SEO parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteTitle">Site Title</Label>
                  <Input
                    id="siteTitle"
                    value={seoSettings.siteTitle}
                    onChange={(e) => setSeoSettings({...seoSettings, siteTitle: e.target.value})}
                    onBlur={() => handleSeoSettingsUpdate(seoSettings)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={seoSettings.metaDescription}
                    onChange={(e) => setSeoSettings({...seoSettings, metaDescription: e.target.value})}
                    onBlur={() => handleSeoSettingsUpdate(seoSettings)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={seoSettings.keywords}
                    onChange={(e) => setSeoSettings({...seoSettings, keywords: e.target.value})}
                    onBlur={() => handleSeoSettingsUpdate(seoSettings)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canonicalUrl">Canonical URL</Label>
                  <Input
                    id="canonicalUrl"
                    value={seoSettings.canonicalUrl}
                    onChange={(e) => setSeoSettings({...seoSettings, canonicalUrl: e.target.value})}
                    onBlur={() => handleSeoSettingsUpdate(seoSettings)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics & Tracking</CardTitle>
                <CardDescription>
                  Configure tracking and analytics tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="analyticsId">Google Analytics ID</Label>
                  <Input
                    id="analyticsId"
                    value={seoSettings.analyticsId}
                    onChange={(e) => setSeoSettings({...seoSettings, analyticsId: e.target.value})}
                    onBlur={() => handleSeoSettingsUpdate(seoSettings)}
                    placeholder="GA-XXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="searchConsoleId">Search Console ID</Label>
                  <Input
                    id="searchConsoleId"
                    value={seoSettings.searchConsoleId}
                    onChange={(e) => setSeoSettings({...seoSettings, searchConsoleId: e.target.value})}
                    onBlur={() => handleSeoSettingsUpdate(seoSettings)}
                    placeholder="SC-XXXXXXXXX"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="sitemapEnabled" 
                    checked={seoSettings.sitemapEnabled}
                    onCheckedChange={(checked) => setSeoSettings({...seoSettings, sitemapEnabled: checked})}
                  />
                  <Label htmlFor="sitemapEnabled">Enable XML Sitemap</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="robotsTxt">Robots.txt</Label>
                  <Textarea
                    id="robotsTxt"
                    value={seoSettings.robotsTxt}
                    onChange={(e) => setSeoSettings({...seoSettings, robotsTxt: e.target.value})}
                    onBlur={() => handleSeoSettingsUpdate(seoSettings)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ads Management Tab */}
        <TabsContent value="ads" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Advertisement Management</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Ad Unit
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">$435.01</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">2,140</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">77,000</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Ad Units</CardTitle>
              <CardDescription>
                Manage your advertisement placements and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ad.type}</Badge>
                      </TableCell>
                      <TableCell>{ad.position}</TableCell>
                      <TableCell>
                        <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                          {ad.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-600">${ad.revenue}</TableCell>
                      <TableCell>{((ad.clicks / ad.impressions) * 100).toFixed(2)}%</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Management Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Customer Reviews</h2>
            <div className="flex items-center space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-3xl font-bold">4.8</div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Based on 1,234 reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">12</div>
                <p className="text-sm text-muted-foreground">Awaiting moderation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Approved Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">8</div>
                <p className="text-sm text-muted-foreground">Published reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Featured Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">5</div>
                <p className="text-sm text-muted-foreground">Highlighted on homepage</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                Moderate and manage customer reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium">{review.author}</div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${
                                star <= review.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <Badge variant={review.status === 'approved' ? 'default' : 'secondary'}>
                          {review.status}
                        </Badge>
                        {review.featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{review.content}</p>
                    <div className="flex items-center space-x-2">
                      {review.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleReviewAction(review.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReviewAction(review.id, 'rejected')}
                          >
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <Star className="w-4 h-4 mr-1" />
                        {review.featured ? 'Unfeature' : 'Feature'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Management Tab */}
        <TabsContent value="design" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Design & Theme Management</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import Theme
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>
                  Customize your website's appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded border"></div>
                    <Input 
                      value={themeSettings.primaryColor} 
                      onChange={(e) => setThemeSettings({...themeSettings, primaryColor: e.target.value})}
                      className="flex-1" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-600 rounded border"></div>
                    <Input 
                      value={themeSettings.secondaryColor} 
                      onChange={(e) => setThemeSettings({...themeSettings, secondaryColor: e.target.value})}
                      className="flex-1" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select defaultValue="inter">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="opensans">Open Sans</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="darkMode" />
                  <Label htmlFor="darkMode">Enable Dark Mode</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Layout Options</CardTitle>
                <CardDescription>
                  Configure page layouts and components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Header Style</Label>
                  <Select defaultValue="modern">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Footer Style</Label>
                  <Select defaultValue="comprehensive">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="stickyHeader" defaultChecked />
                  <Label htmlFor="stickyHeader">Sticky Header</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="breadcrumbs" defaultChecked />
                  <Label htmlFor="breadcrumbs">Show Breadcrumbs</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  See how your changes look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={previewMode === 'tablet' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('tablet')}
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 min-h-[200px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-2" />
                      <p>Website Preview</p>
                      <p className="text-sm">Changes will appear here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}