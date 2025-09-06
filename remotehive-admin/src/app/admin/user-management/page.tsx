'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  Key,
  Settings,
  Eye,
  EyeOff,
  Check,
  X,
  UserPlus,
  Crown,
  Building,
  Briefcase,
  UserCheck,
  AlertTriangle,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Temporarily using simpler components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
// import { toast } from 'react-hot-toast'; // Temporarily disabled

// Types and Interfaces
interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  user_type: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login: string;
  permissions: string[];
  access_limits: {
    pages: string[];
    functions: string[];
    api_calls_per_hour: number;
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_type: string;
  is_system_role: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

interface UserType {
  id: string;
  name: string;
  description: string;
  default_permissions: string[];
  access_level: number;
  can_create_users: boolean;
}

const UserManagementPage: React.FC = () => {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('users');
  
  // Modal States
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateUserTypeOpen, setIsCreateUserTypeOpen] = useState(false);
  const [isPermissionsMatrixOpen, setIsPermissionsMatrixOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);

  // Form States
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: '',
    user_type: '',
    permissions: [] as string[],
    access_limits: {
      pages: [] as string[],
      functions: [] as string[],
      api_calls_per_hour: 100
    }
  });

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    user_type: '',
    permissions: [] as string[]
  });

  const [newUserType, setNewUserType] = useState({
    name: '',
    description: '',
    default_permissions: [] as string[],
    access_level: 1,
    can_create_users: false
  });

  // Sample Data (In real app, this would come from API)
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample permissions
      const samplePermissions: Permission[] = [
        { id: '1', name: 'users.create', description: 'Create new users', category: 'User Management', resource: 'users', action: 'create' },
        { id: '2', name: 'users.read', description: 'View user information', category: 'User Management', resource: 'users', action: 'read' },
        { id: '3', name: 'users.update', description: 'Edit user information', category: 'User Management', resource: 'users', action: 'update' },
        { id: '4', name: 'users.delete', description: 'Delete users', category: 'User Management', resource: 'users', action: 'delete' },
        { id: '5', name: 'jobs.create', description: 'Create job postings', category: 'Job Management', resource: 'jobs', action: 'create' },
        { id: '6', name: 'jobs.read', description: 'View job postings', category: 'Job Management', resource: 'jobs', action: 'read' },
        { id: '7', name: 'jobs.update', description: 'Edit job postings', category: 'Job Management', resource: 'jobs', action: 'update' },
        { id: '8', name: 'jobs.delete', description: 'Delete job postings', category: 'Job Management', resource: 'jobs', action: 'delete' },
        { id: '9', name: 'dashboard.view', description: 'Access dashboard', category: 'Dashboard', resource: 'dashboard', action: 'view' },
        { id: '10', name: 'reports.view', description: 'View reports', category: 'Reports', resource: 'reports', action: 'view' },
        { id: '11', name: 'settings.manage', description: 'Manage system settings', category: 'Settings', resource: 'settings', action: 'manage' },
        { id: '12', name: 'roles.manage', description: 'Manage roles and permissions', category: 'Role Management', resource: 'roles', action: 'manage' }
      ];

      // Sample user types
      const sampleUserTypes: UserType[] = [
        {
          id: '1',
          name: 'Super Admin',
          description: 'Full system access with all permissions',
          default_permissions: samplePermissions.map(p => p.id),
          access_level: 10,
          can_create_users: true
        },
        {
          id: '2',
          name: 'Admin Panel User',
          description: 'Administrative access to manage platform',
          default_permissions: ['1', '2', '3', '5', '6', '7', '9', '10'],
          access_level: 8,
          can_create_users: true
        },
        {
          id: '3',
          name: 'Third Party',
          description: 'External service integration access',
          default_permissions: ['6', '9'],
          access_level: 5,
          can_create_users: false
        },
        {
          id: '4',
          name: 'Freelancer',
          description: 'Freelance service provider',
          default_permissions: ['6', '9'],
          access_level: 3,
          can_create_users: false
        },
        {
          id: '5',
          name: 'Job Seeker',
          description: 'Individual looking for employment',
          default_permissions: ['6', '9'],
          access_level: 2,
          can_create_users: false
        },
        {
          id: '6',
          name: 'Employer',
          description: 'Company or individual posting jobs',
          default_permissions: ['5', '6', '7', '9'],
          access_level: 4,
          can_create_users: false
        }
      ];

      // Sample roles
      const sampleRoles: Role[] = [
        {
          id: '1',
          name: 'Super Administrator',
          description: 'Complete system control',
          permissions: samplePermissions.map(p => p.id),
          user_type: '1',
          is_system_role: true,
          created_at: '2024-01-01'
        },
        {
          id: '2',
          name: 'Platform Manager',
          description: 'Manage platform operations',
          permissions: ['1', '2', '3', '5', '6', '7', '9', '10'],
          user_type: '2',
          is_system_role: false,
          created_at: '2024-01-01'
        },
        {
          id: '3',
          name: 'HR Manager',
          description: 'Manage job postings and candidates',
          permissions: ['5', '6', '7', '9'],
          user_type: '6',
          is_system_role: false,
          created_at: '2024-01-01'
        }
      ];

      // Sample users
      const sampleUsers: User[] = [
        {
          id: '1',
          email: 'admin@remotehive.in',
          full_name: 'System Administrator',
          role: 'Super Administrator',
          user_type: 'Super Admin',
          status: 'active',
          created_at: '2024-01-01',
          last_login: '2024-01-15',
          permissions: samplePermissions.map(p => p.id),
          access_limits: {
            pages: ['*'],
            functions: ['*'],
            api_calls_per_hour: 1000
          }
        },
        {
          id: '2',
          email: 'manager@company.com',
          full_name: 'John Manager',
          role: 'Platform Manager',
          user_type: 'Admin Panel User',
          status: 'active',
          created_at: '2024-01-02',
          last_login: '2024-01-14',
          permissions: ['1', '2', '3', '5', '6', '7', '9', '10'],
          access_limits: {
            pages: ['/admin/dashboard', '/admin/jobs', '/admin/users'],
            functions: ['create_job', 'edit_job', 'view_users'],
            api_calls_per_hour: 500
          }
        },
        {
          id: '3',
          email: 'hr@techcorp.com',
          full_name: 'Sarah HR',
          role: 'HR Manager',
          user_type: 'Employer',
          status: 'active',
          created_at: '2024-01-03',
          last_login: '2024-01-13',
          permissions: ['5', '6', '7', '9'],
          access_limits: {
            pages: ['/admin/dashboard', '/admin/jobs'],
            functions: ['create_job', 'edit_job'],
            api_calls_per_hour: 200
          }
        }
      ];

      setPermissions(samplePermissions);
      setUserTypes(sampleUserTypes);
      setRoles(sampleRoles);
      setUsers(sampleUsers);
    } catch (error) {
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUserType = selectedUserType === 'all' || user.user_type === selectedUserType;
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesUserType && matchesRole && matchesStatus;
  });

  // CRUD Operations
  const handleCreateUser = async () => {
    try {
      // Validate form
      if (!newUser.email || !newUser.full_name || !newUser.password || !newUser.user_type) {
        alert('Please fill in all required fields');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: Date.now().toString(),
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role || 'Default User',
        user_type: newUser.user_type,
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: 'Never',
        permissions: newUser.permissions,
        access_limits: newUser.access_limits
      };

      setUsers([...users, user]);
      setIsCreateUserOpen(false);
      setNewUser({
        email: '',
        full_name: '',
        password: '',
        role: '',
        user_type: '',
        permissions: [],
        access_limits: {
          pages: [],
          functions: [],
          api_calls_per_hour: 100
        }
      });
      alert('User created successfully');
    } catch (error) {
      alert('Failed to create user');
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!newRole.name || !newRole.user_type) {
        alert('Please fill in all required fields');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const role: Role = {
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        user_type: newRole.user_type,
        is_system_role: false,
        created_at: new Date().toISOString()
      };

      setRoles([...roles, role]);
      setIsCreateRoleOpen(false);
      setNewRole({
        name: '',
        description: '',
        user_type: '',
        permissions: []
      });
      alert('Role created successfully');
    } catch (error) {
      alert('Failed to create role');
    }
  };

  const handleCreateUserType = async () => {
    try {
      if (!newUserType.name) {
        alert('Please enter a user type name');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userType: UserType = {
        id: Date.now().toString(),
        name: newUserType.name,
        description: newUserType.description,
        default_permissions: newUserType.default_permissions,
        access_level: newUserType.access_level,
        can_create_users: newUserType.can_create_users
      };

      setUserTypes([...userTypes, userType]);
      setIsCreateUserTypeOpen(false);
      setNewUserType({
        name: '',
        description: '',
        default_permissions: [],
        access_level: 1,
        can_create_users: false
      });
      alert('User type created successfully');
    } catch (error) {
      alert('Failed to create user type');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(users.filter(user => user.id !== userId));
      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' }
          : user
      ));
      alert('User status updated');
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  const getUserTypeIcon = (userType: string) => {
    const icons = {
      'Super Admin': Crown,
      'Admin Panel User': Shield,
      'Third Party': Building,
      'Freelancer': UserCheck,
      'Job Seeker': Users,
      'Employer': Briefcase
    };
    return icons[userType as keyof typeof icons] || Users;
  };

  const groupPermissionsByCategory = (perms: Permission[]) => {
    return perms.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Advanced user, role, and permission management system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => loadInitialData()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isPermissionsMatrixOpen} onOpenChange={setIsPermissionsMatrixOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="w-4 h-4 mr-2" />
                Permissions Matrix
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-4 bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'users' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'roles' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Roles</span>
          </button>
          <button 
            onClick={() => setActiveTab('user-types')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'user-types' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>User Types</span>
          </button>
          <button 
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'permissions' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Permissions</span>
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All User Types</SelectItem>
                    {userTypes.map(type => (
                      <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="grid gap-4">
            {filteredUsers.map((user) => {
              const UserTypeIcon = getUserTypeIcon(user.user_type);
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <UserTypeIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.full_name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{user.user_type}</Badge>
                          <Badge variant="outline">{user.role}</Badge>
                          <Badge className={getStatusBadge(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id)}
                      >
                        {user.status === 'active' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* User Details */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Login:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{user.last_login}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">API Limit:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {user.access_limits.api_calls_per_hour}/hour
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Role Management</h2>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center">
                        {role.name}
                        {role.is_system_role && (
                          <Badge variant="secondary" className="ml-2">System</Badge>
                        )}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{role.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">
                          {userTypes.find(ut => ut.id === role.user_type)?.name || 'Unknown'}
                        </Badge>
                        <Badge variant="outline">
                          {role.permissions.length} permissions
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRoleForEdit(role)}
                        disabled={role.is_system_role}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        )}

        {/* User Types Tab */}
        {activeTab === 'user-types' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Type Management</h2>
            <Dialog open={isCreateUserTypeOpen} onOpenChange={setIsCreateUserTypeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create User Type
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {userTypes.map((userType) => {
              const Icon = getUserTypeIcon(userType.name);
              return (
                <Card key={userType.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{userType.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{userType.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">Level {userType.access_level}</Badge>
                            <Badge variant="outline">
                              {userType.default_permissions.length} default permissions
                            </Badge>
                            {userType.can_create_users && (
                              <Badge variant="secondary">Can create users</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Permission Management</h2>
          
          {Object.entries(groupPermissionsByCategory(permissions)).map(([category, perms]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {perms.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{permission.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {permission.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {permission.resource}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {permission.action}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="ranjeettiwari105@gmail.com"
                />
              </div>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-1">Full Name *</label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password *</label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter secure password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="user_type" className="block text-sm font-medium mb-1">User Type *</label>
                <select 
                  value={newUser.user_type} 
                  onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select user type</option>
                  {userTypes.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-1">Role</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select role</option>
                  {roles.filter(role => role.user_type === userTypes.find(ut => ut.name === newUser.user_type)?.id).map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Rate Limit (calls per hour)</label>
              <Input
                type="number"
                value={newUser.access_limits.api_calls_per_hour}
                onChange={(e) => setNewUser({
                  ...newUser,
                  access_limits: {
                    ...newUser.access_limits,
                    api_calls_per_hour: parseInt(e.target.value) || 100
                  }
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Permissions</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                {Object.entries(groupPermissionsByCategory(permissions)).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">{category}</h4>
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`perm-${permission.id}`}
                          checked={newUser.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({
                                ...newUser,
                                permissions: [...newUser.permissions, permission.id]
                              });
                            } else {
                              setNewUser({
                                ...newUser,
                                permissions: newUser.permissions.filter(p => p !== permission.id)
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`perm-${permission.id}`} className="text-sm">
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>
                Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="role_name" className="block text-sm font-medium mb-1">Role Name *</label>
              <Input
                id="role_name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            
            <div>
              <label htmlFor="role_description" className="block text-sm font-medium mb-1">Description</label>
              <textarea
                id="role_description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Describe the role's purpose and responsibilities"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="role_user_type" className="block text-sm font-medium mb-1">User Type *</label>
              <select 
                value={newRole.user_type} 
                onChange={(e) => setNewRole({ ...newRole, user_type: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select user type</option>
                {userTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Permissions</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                {Object.entries(groupPermissionsByCategory(permissions)).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">{category}</h4>
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`role-perm-${permission.id}`}
                          checked={newRole.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRole({
                                ...newRole,
                                permissions: [...newRole.permissions, permission.id]
                              });
                            } else {
                              setNewRole({
                                ...newRole,
                                permissions: newRole.permissions.filter(p => p !== permission.id)
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`role-perm-${permission.id}`} className="text-sm">
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>
                Create Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Type Dialog */}
      <Dialog open={isCreateUserTypeOpen} onOpenChange={setIsCreateUserTypeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="usertype_name" className="block text-sm font-medium mb-1">User Type Name *</label>
              <Input
                id="usertype_name"
                value={newUserType.name}
                onChange={(e) => setNewUserType({ ...newUserType, name: e.target.value })}
                placeholder="Enter user type name"
              />
            </div>
            
            <div>
              <label htmlFor="usertype_description" className="block text-sm font-medium mb-1">Description</label>
              <textarea
                id="usertype_description"
                value={newUserType.description}
                onChange={(e) => setNewUserType({ ...newUserType, description: e.target.value })}
                placeholder="Describe the user type"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="access_level" className="block text-sm font-medium mb-1">Access Level (1-10)</label>
              <Input
                id="access_level"
                type="number"
                min="1"
                max="10"
                value={newUserType.access_level}
                onChange={(e) => setNewUserType({ ...newUserType, access_level: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="can_create_users"
                checked={newUserType.can_create_users}
                onChange={(e) => setNewUserType({ ...newUserType, can_create_users: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="can_create_users" className="text-sm font-medium">Can create other users</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Default Permissions</label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                {Object.entries(groupPermissionsByCategory(permissions)).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">{category}</h4>
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`usertype-perm-${permission.id}`}
                          checked={newUserType.default_permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUserType({
                                ...newUserType,
                                default_permissions: [...newUserType.default_permissions, permission.id]
                              });
                            } else {
                              setNewUserType({
                                ...newUserType,
                                default_permissions: newUserType.default_permissions.filter(p => p !== permission.id)
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`usertype-perm-${permission.id}`} className="text-sm">
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateUserTypeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUserType}>
                Create User Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Matrix Dialog */}
      <Dialog open={isPermissionsMatrixOpen} onOpenChange={setIsPermissionsMatrixOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissions Matrix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Role</th>
                    {Object.keys(groupPermissionsByCategory(permissions)).map(category => (
                      <th key={category} className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                        {category}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role.id}>
                      <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">
                        {role.name}
                      </td>
                      {Object.entries(groupPermissionsByCategory(permissions)).map(([category, perms]) => {
                        const hasAnyPermission = perms.some(p => role.permissions.includes(p.id));
                        const hasAllPermissions = perms.every(p => role.permissions.includes(p.id));
                        return (
                          <td key={category} className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                            {hasAllPermissions ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : hasAnyPermission ? (
                              <div className="w-5 h-5 bg-yellow-500 rounded mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>Full Access</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-yellow-500 rounded" />
                <span>Partial Access</span>
              </div>
              <div className="flex items-center space-x-1">
                <X className="w-4 h-4 text-red-500" />
                <span>No Access</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;