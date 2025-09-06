'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Users,
  Clock,
  Star,
  Zap,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Tag,
  Target,
  Award,
  Shield,
  Workflow,
  Settings,
} from 'lucide-react';
import { JobPost } from '@/lib/api';
import { JobPostApiService } from '@/services/api/jobposts-api';
import { EmployerApiService, Employer } from '@/services/api/employers-api';
import { JobWorkflowApiService } from '@/services/api/job-workflow-api';
import { CompanySelector } from '@/components/ui/company-selector';

// Job Type Options
const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
  'Temporary',
  'Remote',
  'Hybrid',
];

// Experience Level Options
const EXPERIENCE_LEVELS = [
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Lead',
  'Manager',
  'Director',
  'Executive',
];

// Salary Period Options
const SALARY_PERIODS = [
  'Hourly',
  'Daily',
  'Weekly',
  'Monthly',
  'Yearly',
];

// Priority Options
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low Priority', color: 'bg-gray-100 text-gray-800' },
  { value: 'NORMAL', label: 'Normal Priority', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgent Priority', color: 'bg-red-100 text-red-800' },
];

// Skills Input Component
const SkillsInput = ({ skills, onChange }: { skills: string[]; onChange: (skills: string[]) => void }) => {
  const [inputValue, setInputValue] = useState('');

  const addSkill = () => {
    if (inputValue.trim() && !skills.includes(inputValue.trim())) {
      onChange([...skills, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Input
          placeholder="Add a skill..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button type="button" onClick={addSkill} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="flex items-center space-x-1">
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CreateJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    company_id: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    location_city: '',
    location_state: '',
    location_country: '',
    is_remote: false,
    job_type: '',
    experience_level: '',
    salary_min: '',
    salary_max: '',
    salary_period: 'Yearly',
    salary_currency: 'USD',
    application_deadline: '',
    contact_email: '',
    contact_phone: '',
    application_url: '',
    tags: [] as string[],
    skills_required: [] as string[],
    is_featured: false,
    is_urgent: false,
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    status: 'draft' as string,
  });
  
  // UI state
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'save' | 'submit'>('save');
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch employers
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const response = await EmployerApiService.getEmployers();
        setEmployers(response.employers || []);
      } catch (error) {
        console.error('Error fetching employers:', error);
      }
    };
    
    fetchEmployers();
  }, []);
  
  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.job_type) newErrors.job_type = 'Job type is required';
    if (!formData.location_city.trim() && !formData.is_remote) {
      newErrors.location_city = 'Location is required for non-remote jobs';
    }
    if (formData.salary_min && formData.salary_max) {
      const min = parseFloat(formData.salary_min);
      const max = parseFloat(formData.salary_max);
      if (min >= max) {
        newErrors.salary_max = 'Maximum salary must be greater than minimum salary';
      }
    }
    if (formData.application_deadline) {
      const deadline = new Date(formData.application_deadline);
      const today = new Date();
      if (deadline <= today) {
        newErrors.application_deadline = 'Application deadline must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (action: 'save' | 'submit') => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitAction(action);
      
      // Prepare job data to match backend JobPostCreate schema
      // Map form job types to API expected enum values
      const jobTypeMap: Record<string, string> = {
        'Full-time': 'full_time',
        'Part-time': 'part_time',
        'Contract': 'contract',
        'Freelance': 'freelance',
        'Internship': 'internship',
        'Temporary': 'contract',
        'Remote': 'full_time',
        'Hybrid': 'full_time'
      };
      
      // Map form experience levels to API expected enum values
      const experienceLevelMap: Record<string, string> = {
        'Entry Level': 'entry',
        'Mid Level': 'mid',
        'Senior Level': 'senior',
        'Lead': 'lead',
        'Manager': 'senior',
        'Director': 'executive',
        'Executive': 'executive'
      };
      
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || undefined,
        responsibilities: formData.responsibilities || undefined,
        benefits: formData.benefits || undefined,
        employer_id: formData.company_id || undefined,
        job_type: jobTypeMap[formData.job_type] || 'full_time',
        work_location: formData.is_remote ? 'remote' : 'onsite',
        experience_level: experienceLevelMap[formData.experience_level] || 'mid',
        location_city: formData.location_city || undefined,
        location_state: formData.location_state || undefined,
        location_country: formData.location_country || undefined,
        is_remote: formData.is_remote,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
        salary_currency: formData.salary_currency || 'USD',
        skills_required: formData.skills_required,
        application_deadline: formData.application_deadline || undefined,
        is_featured: formData.is_featured,
        is_urgent: false,
        auto_publish: action === 'submit',
        requires_review: action === 'submit'
      };
      
      // Create the job post
      const createdJob = await JobPostApiService.createJobPost(jobData);
      
      if (!createdJob) {
        throw new Error('Failed to create job post - no response from server');
      }
      
      // If submitting for approval, call the workflow API
      if (action === 'submit') {
        await JobWorkflowApiService.submitForApproval(
          createdJob.id.toString(),
          'Job submitted for approval from creation form'
        );
      }
      
      toast({
        title: 'Success',
        description: action === 'submit' 
          ? 'Job created and submitted for approval successfully'
          : 'Job saved as draft successfully',
      });
      
      // Redirect to workflow page
      router.push('/admin/jobs/workflow');
      
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create job post',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Job Post</h1>
            <p className="text-muted-foreground">
              Create a new job posting and manage it through the workflow system
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Essential details about the job position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>
                
                <div>
                  <CompanySelector
                    value={formData.company}
                    onChange={(companyName, employerId) => {
                      handleInputChange('company', companyName);
                      if (employerId) {
                        handleInputChange('company_id', employerId);
                      }
                    }}
                    placeholder="Select or create company..."
                    required={true}
                  />
                  {errors.company && <p className="text-sm text-red-500 mt-1">{errors.company}</p>}
                </div>
                
                <div>
                  <Label htmlFor="job_type">Job Type *</Label>
                  <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
                    <SelectTrigger className={errors.job_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.job_type && <p className="text-sm text-red-500 mt-1">{errors.job_type}</p>}
                </div>
                
                <div>
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Job Description</span>
              </CardTitle>
              <CardDescription>
                Detailed information about the role and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the job role, what the candidate will be doing..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
              </div>
              
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="List the required qualifications, skills, experience..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  placeholder="Outline the key responsibilities and duties..."
                  value={formData.responsibilities}
                  onChange={(e) => handleInputChange('responsibilities', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="benefits">Benefits</Label>
                <Textarea
                  id="benefits"
                  placeholder="List the benefits, perks, and compensation details..."
                  value={formData.benefits}
                  onChange={(e) => handleInputChange('benefits', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Location & Remote */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Location</span>
              </CardTitle>
              <CardDescription>
                Where the job is located or if it's remote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_remote"
                  checked={formData.is_remote}
                  onCheckedChange={(checked) => handleInputChange('is_remote', checked)}
                />
                <Label htmlFor="is_remote" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>This is a remote position</span>
                </Label>
              </div>
              
              {!formData.is_remote && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="location_city">City *</Label>
                    <Input
                      id="location_city"
                      placeholder="e.g. San Francisco"
                      value={formData.location_city}
                      onChange={(e) => handleInputChange('location_city', e.target.value)}
                      className={errors.location_city ? 'border-red-500' : ''}
                    />
                    {errors.location_city && <p className="text-sm text-red-500 mt-1">{errors.location_city}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="location_state">State/Province</Label>
                    <Input
                      id="location_state"
                      placeholder="e.g. California"
                      value={formData.location_state}
                      onChange={(e) => handleInputChange('location_state', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location_country">Country</Label>
                    <Input
                      id="location_country"
                      placeholder="e.g. United States"
                      value={formData.location_country}
                      onChange={(e) => handleInputChange('location_country', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Salary Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Salary Information</span>
              </CardTitle>
              <CardDescription>
                Compensation details for the position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="salary_min">Minimum Salary</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    placeholder="50000"
                    value={formData.salary_min}
                    onChange={(e) => handleInputChange('salary_min', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="salary_max">Maximum Salary</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    placeholder="80000"
                    value={formData.salary_max}
                    onChange={(e) => handleInputChange('salary_max', e.target.value)}
                    className={errors.salary_max ? 'border-red-500' : ''}
                  />
                  {errors.salary_max && <p className="text-sm text-red-500 mt-1">{errors.salary_max}</p>}
                </div>
                
                <div>
                  <Label htmlFor="salary_period">Period</Label>
                  <Select value={formData.salary_period} onValueChange={(value) => handleInputChange('salary_period', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_PERIODS.map((period) => (
                        <SelectItem key={period} value={period}>
                          {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="salary_currency">Currency</Label>
                  <Select value={formData.salary_currency} onValueChange={(value) => handleInputChange('salary_currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Skills and Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Skills & Tags</span>
              </CardTitle>
              <CardDescription>
                Required skills and relevant tags for better discoverability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Required Skills</Label>
                <SkillsInput
                  skills={formData.skills_required}
                  onChange={(skills) => handleInputChange('skills_required', skills)}
                />
              </div>
              
              <div>
                <Label>Tags</Label>
                <SkillsInput
                  skills={formData.tags}
                  onChange={(tags) => handleInputChange('tags', tags)}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Application Details</span>
              </CardTitle>
              <CardDescription>
                How candidates can apply and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="ranjeettiwary589@gmail.com"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="application_url">Application URL</Label>
                  <Input
                    id="application_url"
                    type="url"
                    placeholder="https://company.com/apply"
                    value={formData.application_url}
                    onChange={(e) => handleInputChange('application_url', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                    className={errors.application_deadline ? 'border-red-500' : ''}
                  />
                  {errors.application_deadline && <p className="text-sm text-red-500 mt-1">{errors.application_deadline}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Job Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value: any) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <Badge className={option.color}>{option.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  />
                  <Label htmlFor="is_featured" className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Featured Job</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_urgent"
                    checked={formData.is_urgent}
                    onCheckedChange={(checked) => handleInputChange('is_urgent', checked)}
                  />
                  <Label htmlFor="is_urgent" className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-red-500" />
                    <span>Urgent Hiring</span>
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Workflow Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Workflow className="w-5 h-5" />
                <span>Workflow Actions</span>
              </CardTitle>
              <CardDescription>
                Choose how to handle this job post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleSubmit('save')}
                disabled={isSubmitting}
                className="w-full"
                variant="outline"
              >
                {isSubmitting && submitAction === 'save' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              
              <Button
                onClick={() => handleSubmit('submit')}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting && submitAction === 'submit' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Save as Draft:</strong> Job will be saved but not visible to candidates</p>
                <p><strong>Submit for Approval:</strong> Job will be sent to admin for review and approval</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{formData.title || 'Job Title'}</h3>
                  <p className="text-gray-600 flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    {formData.company || 'Company Name'}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {formData.is_remote ? 'Remote' : (formData.location_city || 'Location')}
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {formData.job_type || 'Job Type'}
                  </div>
                  
                  {(formData.salary_min || formData.salary_max) && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formData.salary_min && formData.salary_max
                        ? `${formData.salary_currency} ${formData.salary_min} - ${formData.salary_max}`
                        : formData.salary_min
                        ? `${formData.salary_currency} ${formData.salary_min}+`
                        : `Up to ${formData.salary_currency} ${formData.salary_max}`
                      } {formData.salary_period.toLowerCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {formData.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {formData.is_urgent && (
                    <Badge className="bg-red-100 text-red-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                  <Badge className={PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.color}>
                    {PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label}
                  </Badge>
                </div>
                
                {formData.description && (
                  <div>
                    <h4 className="font-medium mb-1">Description</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {formData.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}