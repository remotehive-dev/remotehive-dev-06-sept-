'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  User,
  Tag,
  Globe,
  Image,
  Video,
  Link,
  Copy,
  ExternalLink,
  Settings,
  BookOpen,
  MessageSquare,
  Star,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { GlassCard, StatsCard } from '@/components/ui/advanced/glass-card';
import { DataTable } from '@/components/ui/advanced/data-table';
import { AnimatedModal } from '@/components/ui/advanced/animated-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

interface ContentManagementProps {
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Mock data for content stats
const contentStats = {
  totalPosts: 45,
  publishedPosts: 38,
  draftPosts: 7,
  totalViews: 12847,
  avgReadTime: '4.2 min',
  engagement: 68.5
};

// Mock data for content items
const mockContent = [
  {
    id: '1',
    title: 'The Future of Remote Work: Trends for 2024',
    type: 'blog_post',
    status: 'published',
    author: 'Sarah Johnson',
    authorAvatar: '/api/placeholder/32/32',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-18'),
    publishedAt: new Date('2024-01-18'),
    views: 1247,
    likes: 89,
    comments: 23,
    readTime: '5 min',
    category: 'Industry Insights',
    tags: ['remote work', 'trends', '2024', 'future'],
    excerpt: 'Explore the latest trends shaping the future of remote work and how companies are adapting to the new normal.',
    content: '# The Future of Remote Work\n\nRemote work has transformed from a niche benefit to a mainstream expectation...',
    featuredImage: '/api/placeholder/400/200',
    seoTitle: 'Future of Remote Work 2024 - Trends & Insights',
    seoDescription: 'Discover the key trends shaping remote work in 2024 and beyond.',
    slug: 'future-of-remote-work-2024',
    isPublic: true,
    isFeatured: true
  },
  {
    id: '2',
    title: 'About RemoteHive',
    type: 'page',
    status: 'published',
    author: 'Admin',
    authorAvatar: '/api/placeholder/32/32',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    publishedAt: new Date('2024-01-10'),
    views: 3456,
    likes: 156,
    comments: 0,
    readTime: '3 min',
    category: 'Company',
    tags: ['about', 'company', 'mission'],
    excerpt: 'Learn about RemoteHive\'s mission to connect remote workers with amazing opportunities.',
    content: '# About RemoteHive\n\nRemoteHive is the premier platform for remote job opportunities...',
    featuredImage: '/api/placeholder/400/200',
    seoTitle: 'About RemoteHive - Connecting Remote Talent',
    seoDescription: 'Learn about RemoteHive\'s mission and how we\'re revolutionizing remote work.',
    slug: 'about',
    isPublic: true,
    isFeatured: false
  },
  {
    id: '3',
    title: 'How I Found My Dream Remote Job',
    type: 'testimonial',
    status: 'published',
    author: 'Mike Chen',
    authorAvatar: '/api/placeholder/32/32',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    publishedAt: new Date('2024-01-12'),
    views: 892,
    likes: 67,
    comments: 15,
    readTime: '2 min',
    category: 'Success Stories',
    tags: ['testimonial', 'success', 'remote job'],
    excerpt: 'A data scientist shares his journey to finding the perfect remote position through RemoteHive.',
    content: '# My RemoteHive Success Story\n\nAfter months of searching, I finally found my dream job...',
    featuredImage: '/api/placeholder/400/200',
    seoTitle: 'Remote Job Success Story - Mike Chen',
    seoDescription: 'Read how Mike found his dream remote data science job through RemoteHive.',
    slug: 'mike-chen-success-story',
    isPublic: true,
    isFeatured: true
  },
  {
    id: '4',
    title: '10 Tips for Remote Job Interviews',
    type: 'blog_post',
    status: 'draft',
    author: 'Emily Davis',
    authorAvatar: '/api/placeholder/32/32',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-20'),
    publishedAt: null,
    views: 0,
    likes: 0,
    comments: 0,
    readTime: '6 min',
    category: 'Career Tips',
    tags: ['interviews', 'tips', 'remote work', 'career'],
    excerpt: 'Master the art of remote job interviews with these proven tips and strategies.',
    content: '# Remote Interview Success\n\nRemote interviews require a different approach...',
    featuredImage: '/api/placeholder/400/200',
    seoTitle: 'Remote Job Interview Tips - Complete Guide',
    seoDescription: 'Learn how to ace your remote job interviews with these expert tips.',
    slug: 'remote-job-interview-tips',
    isPublic: false,
    isFeatured: false
  }
];

const contentTypes = [
  { value: 'blog_post', label: 'Blog Post', icon: FileText },
  { value: 'page', label: 'Page', icon: Globe },
  { value: 'testimonial', label: 'Testimonial', icon: MessageSquare },
  { value: 'announcement', label: 'Announcement', icon: Zap }
];

const contentCategories = [
  'Industry Insights',
  'Career Tips',
  'Company',
  'Success Stories',
  'Product Updates',
  'Remote Work',
  'Technology'
];

export function ContentManagement({ className }: ContentManagementProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    type: 'blog_post',
    category: '',
    tags: '',
    excerpt: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    slug: '',
    isPublic: true,
    isFeatured: false
  });

  const filteredContent = mockContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || content.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || content.category === categoryFilter;
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'published' && content.status === 'published') ||
                      (selectedTab === 'drafts' && content.status === 'draft') ||
                      (selectedTab === 'featured' && content.isFeatured);
    return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesTab;
  });

  const handleCreate = () => {
    toast({
      title: 'Content Created',
      description: 'New content has been created successfully.'
    });
    setCreateModal(false);
    setNewContent({
      title: '',
      type: 'blog_post',
      category: '',
      tags: '',
      excerpt: '',
      content: '',
      seoTitle: '',
      seoDescription: '',
      slug: '',
      isPublic: true,
      isFeatured: false
    });
  };

  const handleUpdate = () => {
    toast({
      title: 'Content Updated',
      description: 'Content has been updated successfully.'
    });
    setEditModal(false);
  };

  const handleDelete = () => {
    toast({
      title: 'Content Deleted',
      description: 'Content has been deleted successfully.'
    });
    setDeleteModal(false);
  };

  const handlePublish = (contentId: string) => {
    toast({
      title: 'Content Published',
      description: 'Content is now live and visible to users.'
    });
  };

  const handleUnpublish = (contentId: string) => {
    toast({
      title: 'Content Unpublished',
      description: 'Content has been moved to drafts.'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Published</Badge>;
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Draft</Badge>;
      case 'archived': return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Archived</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = contentTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const contentColumns = [
    {
      key: 'content',
      label: 'Content',
      render: (content: any) => (
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {getTypeIcon(content.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-slate-900 dark:text-white">{content.title}</h3>
              {content.isFeatured && <Star className="w-4 h-4 text-yellow-500" />}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{content.excerpt}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-slate-500 flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                {content.category}
              </span>
              <span className="text-xs text-slate-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {content.readTime}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'author',
      label: 'Author',
      render: (content: any) => (
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={content.authorAvatar} alt={content.author} />
            <AvatarFallback>{content.author.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{content.author}</p>
            <p className="text-xs text-slate-500">Author</p>
          </div>
        </div>
      )
    },
    {
      key: 'stats',
      label: 'Performance',
      render: (content: any) => (
        <div className="text-center">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{content.views}</p>
              <p className="text-slate-600 dark:text-slate-400">Views</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{content.likes}</p>
              <p className="text-slate-600 dark:text-slate-400">Likes</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{content.comments}</p>
              <p className="text-slate-600 dark:text-slate-400">Comments</p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (content: any) => (
        <div className="text-center">
          <div className="mb-2">
            {getStatusBadge(content.status)}
          </div>
          <p className="text-xs text-slate-500">
            {content.status === 'published' ? 'Published' : 'Updated'}
          </p>
          <p className="text-xs text-slate-500">
            {(content.publishedAt || content.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (content: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedContent(content);
              setPreviewModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                setSelectedContent(content);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/blog/${content.slug}`, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`/blog/${content.slug}`)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              {content.status === 'published' ? (
                <DropdownMenuItem onClick={() => handleUnpublish(content.id)}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Unpublish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handlePublish(content.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedContent(content);
                  setDeleteModal(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Content Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Create and manage website content, blog posts, and pages
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-600"
              onClick={() => setCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <StatsCard
          title="Total Content"
          value={contentStats.totalPosts}
          change={8.2}
          trend="up"
          icon={FileText}
          description="All content items"
        />
        <StatsCard
          title="Published"
          value={contentStats.publishedPosts}
          change={5.1}
          trend="up"
          icon={CheckCircle}
          description="Live content"
          variant="success"
        />
        <StatsCard
          title="Drafts"
          value={contentStats.draftPosts}
          change={-2.3}
          trend="down"
          icon={Edit}
          description="Work in progress"
          variant="warning"
        />
        <StatsCard
          title="Total Views"
          value={contentStats.totalViews.toLocaleString()}
          change={15.7}
          trend="up"
          icon={Eye}
          description="All time views"
        />
        <StatsCard
          title="Avg Read Time"
          value={contentStats.avgReadTime}
          change={-5.2}
          trend="down"
          icon={Clock}
          description="Reader engagement"
        />
        <StatsCard
          title="Engagement"
          value={`${contentStats.engagement}%`}
          change={12.4}
          trend="up"
          icon={TrendingUp}
          description="User interaction"
          variant="success"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="published">Published ({contentStats.publishedPosts})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({contentStats.draftPosts})</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {contentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {contentCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </GlassCard>

          {/* Content Table */}
          <TabsContent value={selectedTab} className="space-y-6">
            <DataTable
              data={filteredContent}
              columns={contentColumns}
              searchable={false}
              pagination={true}
              emptyState={{
                title: 'No content found',
                description: 'No content matches your current filters.',
                icon: FileText
              }}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create Content Modal */}
      <AnimatedModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Content"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                placeholder="Enter content title"
                value={newContent.title}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <Select value={newContent.type} onValueChange={(value) => setNewContent({ ...newContent, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={newContent.category} onValueChange={(value) => setNewContent({ ...newContent, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {contentCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                placeholder="url-friendly-slug"
                value={newContent.slug}
                onChange={(e) => setNewContent({ ...newContent, slug: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <Input
              placeholder="Enter tags separated by commas"
              value={newContent.tags}
              onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <Textarea
              placeholder="Brief description of the content"
              value={newContent.excerpt}
              onChange={(e) => setNewContent({ ...newContent, excerpt: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content (Markdown)</label>
            <Textarea
              placeholder="Write your content in Markdown format..."
              value={newContent.content}
              onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
              rows={8}
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SEO Title</label>
              <Input
                placeholder="SEO optimized title"
                value={newContent.seoTitle}
                onChange={(e) => setNewContent({ ...newContent, seoTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">SEO Description</label>
              <Input
                placeholder="SEO meta description"
                value={newContent.seoDescription}
                onChange={(e) => setNewContent({ ...newContent, seoDescription: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newContent.isPublic} 
                  onCheckedChange={(checked) => setNewContent({ ...newContent, isPublic: checked })}
                />
                <label className="text-sm font-medium">Public</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newContent.isFeatured} 
                  onCheckedChange={(checked) => setNewContent({ ...newContent, isFeatured: checked })}
                />
                <label className="text-sm font-medium">Featured</label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button onClick={handleCreate}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create & Publish
            </Button>
          </div>
        </div>
      </AnimatedModal>

      {/* Edit Content Modal */}
      <AnimatedModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Content"
        size="xl"
      >
        {selectedContent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input defaultValue={selectedContent.title} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <Select defaultValue={selectedContent.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select defaultValue={selectedContent.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input defaultValue={selectedContent.slug} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <Input defaultValue={selectedContent.tags.join(', ')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Excerpt</label>
              <Textarea defaultValue={selectedContent.excerpt} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content (Markdown)</label>
              <Textarea 
                defaultValue={selectedContent.content} 
                rows={8} 
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">SEO Title</label>
                <Input defaultValue={selectedContent.seoTitle} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SEO Description</label>
                <Input defaultValue={selectedContent.seoDescription} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked={selectedContent.isPublic} />
                  <label className="text-sm font-medium">Public</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked={selectedContent.isFeatured} />
                  <label className="text-sm font-medium">Featured</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditModal(false)}>
                Cancel
              </Button>
              <Button variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={handleUpdate}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Update & Publish
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Preview Modal */}
      <AnimatedModal
        isOpen={previewModal}
        onClose={() => setPreviewModal(false)}
        title="Content Preview"
        size="xl"
      >
        {selectedContent && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedContent.title}
                </h1>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(selectedContent.status)}
                  {selectedContent.isFeatured && <Star className="w-5 h-5 text-yellow-500" />}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {selectedContent.author}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {selectedContent.createdAt.toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {selectedContent.readTime}
                </span>
                <span className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  {selectedContent.category}
                </span>
              </div>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                {selectedContent.excerpt}
              </p>
              <div className="whitespace-pre-wrap">
                {selectedContent.content}
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex flex-wrap gap-2">
                {selectedContent.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setPreviewModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setPreviewModal(false);
                setEditModal(true);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Content
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Delete Confirmation Modal */}
      <AnimatedModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Content"
        size="md"
      >
        {selectedContent && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-900 dark:text-red-200">Confirm Deletion</h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                Are you sure you want to delete "{selectedContent.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Content
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>
    </motion.div>
  );
}