'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employer {
  id: string;
  company_name: string;
  company_email: string;
}

interface CompanySelectorProps {
  value: string;
  onChange: (value: string, employerId?: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function CompanySelector({ value, onChange, placeholder = "Select or create company...", required = false }: CompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    company_name: '',
    email: '',
    website: '',
    description: '',
    industry: '',
    company_size: '',
    location: ''
  });

  // Fetch employers
  const fetchEmployers = async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      
      console.log('Fetching companies with params:', params.toString());
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/companies?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Companies data received:', data);
        // Convert companies to employer format for compatibility
        const employersData = data.map((company: any) => ({
          id: company.id,
          company_name: company.name,
          company_email: company.email || `contact@${company.name.toLowerCase().replace(/\s+/g, '')}.com`
        }));
        setEmployers(employersData);
      } else {
        console.error('Failed to fetch companies:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        fetchEmployers(searchTerm);
      } else {
        fetchEmployers();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCreateCompany = async () => {
    if (!newCompanyData.company_name || !newCompanyData.email) {
      alert('Company name and email are required');
      return;
    }

    setCreating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompanyData),
      });

      if (response.ok) {
        const data = await response.json();
        // Convert company response to employer format for compatibility
        const newEmployer = {
          id: data.id,
          company_name: data.name,
          company_email: newCompanyData.email
        };
        
        // Add to employers list
        setEmployers(prev => [newEmployer, ...prev]);
        
        // Select the new company
        onChange(newEmployer.company_name, newEmployer.id);
        
        // Reset form and close dialog
        setNewCompanyData({
          company_name: '',
          email: '',
          website: '',
          description: '',
          industry: '',
          company_size: '',
          location: ''
        });
        setCreateDialogOpen(false);
        setOpen(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const selectedEmployer = employers.find(emp => emp.company_name === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="company">Company {required && '*'}</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
            
          >
            {value ? (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {value}
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] p-0">
            <div className="p-2">
              <Input 
                placeholder="Search companies..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-[200px] overflow-y-auto">
                {loading ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                ) : employers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No companies found.</div>
                ) : (
                  employers.map((employer) => (
                    <div
                      key={employer.id}
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded-sm"
                      onClick={() => {
                        console.log('Company item clicked:', employer);
                        onChange(employer.company_name, employer.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === employer.company_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Building2 className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{employer.company_name}</div>
                        <div className="text-sm text-muted-foreground">{employer.company_email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>
                Add a new company to the database.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-company-name">Company Name *</Label>
                <Input
                  id="new-company-name"
                  value={newCompanyData.company_name}
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="e.g. TechCorp Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-company-email">Email *</Label>
                <Input
                  id="new-company-email"
                  type="email"
                  value={newCompanyData.email}
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-company-website">Website</Label>
                <Input
                  id="new-company-website"
                  value={newCompanyData.website}
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-company-industry">Industry</Label>
                <Select value={newCompanyData.industry} onValueChange={(value) => setNewCompanyData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-company-size">Company Size</Label>
                <Select value={newCompanyData.company_size} onValueChange={(value) => setNewCompanyData(prev => ({ ...prev, company_size: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-company-location">Location</Label>
                <Input
                  id="new-company-location"
                  value={newCompanyData.location}
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-company-description">Description</Label>
                <Textarea
                  id="new-company-description"
                  value={newCompanyData.description}
                  onChange={(e) => setNewCompanyData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the company..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCompany} disabled={creating}>
                {creating ? 'Creating...' : 'Create Company'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}