'use client';

import React, { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Shield,
  TrendingUp,
  RefreshCw,
  Settings,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Search,
  Edit,
  Trash2,
  Globe,
  Lock,
  Zap
} from 'lucide-react';

interface PaymentGateway {
  id: string;
  name: string;
  type: 'razorpay' | 'stripe' | 'payu' | 'cashfree' | 'paypal' | 'square';
  status: 'active' | 'inactive' | 'testing';
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  supportedCurrencies: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
  features: string[];
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_method: string;
  customer_email: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'weekly';
  features: string[];
  status: 'active' | 'inactive';
  subscribers: number;
}

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [gateways, setGateways] = useState<PaymentGateway[]>([
    {
      id: '1',
      name: 'Razorpay Production',
      type: 'razorpay',
      status: 'active',
      apiKey: 'rzp_live_***',
      secretKey: '***',
      webhookUrl: 'https://api.remotehive.com/webhooks/razorpay',
      supportedCurrencies: ['INR', 'USD'],
      fees: { percentage: 2.0, fixed: 0 },
      features: ['UPI', 'Cards', 'Net Banking', 'Wallets']
    },
    {
      id: '2',
      name: 'Stripe Global',
      type: 'stripe',
      status: 'active',
      apiKey: 'pk_live_***',
      secretKey: 'sk_live_***',
      webhookUrl: 'https://api.remotehive.com/webhooks/stripe',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
      fees: { percentage: 2.9, fixed: 0.30 },
      features: ['Cards', 'Apple Pay', 'Google Pay', 'SEPA']
    }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'txn_001',
      amount: 2999,
      currency: 'INR',
      status: 'completed',
      payment_method: 'upi',
      customer_email: 'ranjeettiwary589@gmail.com',
      customer_name: 'John Doe',
      created_at: '2024-12-25T10:30:00Z',
      updated_at: '2024-12-25T10:30:00Z'
    },
    {
      id: 'txn_002',
      amount: 4999,
      currency: 'USD',
      status: 'pending',
      payment_method: 'card',
      customer_email: 'ranjeettiwari105@gmail.com',
      customer_name: 'Sarah Smith',
      created_at: '2024-12-25T09:15:00Z',
      updated_at: '2024-12-25T09:15:00Z'
    }
  ]);

  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([
    {
      id: 'plan_1',
      name: 'Basic Plan',
      price: 999,
      currency: 'INR',
      interval: 'monthly',
      features: ['10 Job Postings', 'Basic Analytics', 'Email Support'],
      status: 'active',
      subscribers: 245
    },
    {
      id: 'plan_2',
      name: 'Pro Plan',
      price: 2999,
      currency: 'INR',
      interval: 'monthly',
      features: ['Unlimited Job Postings', 'Advanced Analytics', 'Priority Support', 'API Access'],
      status: 'active',
      subscribers: 89
    }
  ]);

  const [showAddGateway, setShowAddGateway] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);

  // Fetch real data from database
  useEffect(() => {
    fetchDashboardData();
    fetchTransactions();
    fetchGateways();
    fetchPaymentPlans();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch analytics data from FastAPI backend
      const response = await apiService.get('/admin/payments/analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      
      setRealTimeStats({
        totalRevenue: data.totalRevenue || 0,
        totalTransactions: data.totalTransactions || 0,
        successRate: data.successRate || 0,
        fraudDetected: data.fraudDetected || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiService.get('/admin/payments/transactions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]); // Ensure state is set to empty array on error
    }
  };

  const fetchGateways = async () => {
    try {
      const response = await apiService.get('/admin/payments/gateways');
      
      if (!response.ok) {
        throw new Error('Failed to fetch gateways');
      }
      
      const data = await response.json();
      
      // Ensure arrays properties are always arrays for each gateway
      const gatewaysWithArrays = (data.gateways || []).map((gateway: any) => ({
        ...gateway,
        supportedCurrencies: Array.isArray(gateway.supportedCurrencies) ? gateway.supportedCurrencies : [],
        features: Array.isArray(gateway.features) ? gateway.features : [],
        fees: gateway.fees || { percentage: 0, fixed: 0 }
      }));
      
      setGateways(gatewaysWithArrays);
    } catch (error) {
      console.error('Error fetching gateways:', error);
      setGateways([]); // Ensure state is set to empty array on error
    }
  };

  const fetchPaymentPlans = async () => {
    try {
      const response = await apiService.get('/admin/payments/plans');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment plans');
      }
      
      const data = await response.json();
      
      // Ensure features array is always an array for each plan
      const plansWithArrays = (data.plans || []).map((plan: any) => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));
      
      setPaymentPlans(plansWithArrays);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      setPaymentPlans([]); // Ensure state is set to empty array on error
    }
  };
  const [loading, setLoading] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successRate: 0,
    fraudDetected: 0
  });

  const getGatewayIcon = (type: string) => {
    const icons = {
      razorpay: '🇮🇳',
      stripe: '💳',
      payu: '💰',
      cashfree: '💸',
      paypal: '🅿️',
      square: '⬜'
    };
    return icons[type as keyof typeof icons] || '💳';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'success': return 'bg-green-100 text-green-800';
      case 'pending': case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': case 'inactive': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFraudRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'text-green-600' };
    if (score < 70) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'High', color: 'text-red-600' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">Manage payment gateways, transactions, and billing plans</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{realTimeStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{realTimeStats.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">+8.2% from last month</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{realTimeStats.successRate.toFixed(1)}%</p>
                <p className="text-xs text-green-600 mt-1">+2.1% from last month</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fraud Detected</p>
                <p className="text-2xl font-bold text-gray-900">{realTimeStats.fraudDetected}</p>
                <p className="text-xs text-red-600 mt-1">-15.3% from last month</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gateways">Gateways</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="plans">Payment Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (transactions || []).slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.customer_name || transaction.customer_email}</p>
                        <p className="text-sm text-gray-600">{transaction.payment_method || 'N/A'} • {transaction.gateway || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{transaction.currency || 'N/A'} {((transaction.amount || 0) / 100).toFixed(2)}</p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Gateway Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Gateway Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (gateways || []).map((gateway) => (
                    <div key={gateway.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getGatewayIcon(gateway.type)}</span>
                        <div>
                          <p className="font-medium">{gateway.display_name || gateway.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{gateway.provider || 'N/A'}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor((gateway.is_active ?? false) ? 'active' : 'inactive')}>
                        {(gateway.is_active ?? false) ? 'active' : 'inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Payment Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Payment trends chart will be displayed here</p>
                  <p className="text-sm text-gray-500">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Gateways Tab */}
        <TabsContent value="gateways" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment Gateways</h2>
            <Button onClick={() => setShowAddGateway(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Gateway
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(gateways || []).map((gateway) => (
              <Card key={gateway.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getGatewayIcon(gateway.type)}</span>
                      <div>
                        <CardTitle className="text-lg">{gateway.name || 'N/A'}</CardTitle>
                        <CardDescription>{gateway.type || 'N/A'}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(gateway.status || 'inactive')}>
                      {gateway.status || 'inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Supported Currencies</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(gateway.supportedCurrencies || []).map((currency) => (
                        <Badge key={currency} variant="outline" className="text-xs">
                          {currency}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transaction Fees</p>
                    <p className="text-sm text-gray-900">
                      {(gateway.fees?.percentage || 0)}% + {(gateway.fees?.fixed || 0) > 0 ? `$${gateway.fees?.fixed || 0}` : 'No fixed fee'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Features</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(gateway.features || []).slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {(gateway.features || []).length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(gateway.features || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Gateway Card */}
            <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer" onClick={() => setShowAddGateway(true)}>
              <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Plus className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Add New Gateway</h3>
                <p className="text-sm text-gray-600">Configure a new payment gateway</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search transactions..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium text-gray-600">Transaction ID</th>
                      <th className="p-4 font-medium text-gray-600">Customer</th>
                      <th className="p-4 font-medium text-gray-600">Amount</th>
                      <th className="p-4 font-medium text-gray-600">Gateway</th>
                      <th className="p-4 font-medium text-gray-600">Status</th>
                      <th className="p-4 font-medium text-gray-600">Fraud Risk</th>
                      <th className="p-4 font-medium text-gray-600">Date</th>
                      <th className="p-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transactions || []).map((transaction) => {
                      const fraudRisk = getFraudRiskLevel(0); // Default to 0 since fraud data is in separate table
                      return (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-mono text-sm">{transaction.id}</td>
                          <td className="p-4">{transaction.customer_email || 'N/A'}</td>
                          <td className="p-4 font-medium">{transaction.currency || 'INR'} {transaction.amount || 0}</td>
                          <td className="p-4">{transaction.payment_method || 'N/A'}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className={fraudRisk.color}>
                              {fraudRisk.level} (0)
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Detection Tab */}
        <TabsContent value="fraud" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Fraud Detection</h2>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Configure Rules
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Shield className="w-5 h-5" />
                  Low Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">1,156</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <Progress value={85} className="mt-4" />
                  <p className="text-xs text-gray-500 mt-2">85% of total</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  Medium Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">68</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <Progress value={12} className="mt-4" />
                  <p className="text-xs text-gray-500 mt-2">12% of total</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  High Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">23</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <Progress value={3} className="mt-4" />
                  <p className="text-xs text-gray-500 mt-2">3% of total</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Rules</CardTitle>
              <CardDescription>Configure automatic fraud detection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Velocity Checks</Label>
                      <p className="text-sm text-gray-600">Monitor transaction frequency</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Geolocation Verification</Label>
                      <p className="text-sm text-gray-600">Check unusual location patterns</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Device Fingerprinting</Label>
                      <p className="text-sm text-gray-600">Track device characteristics</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Amount Threshold</Label>
                      <p className="text-sm text-gray-600">Flag high-value transactions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Blacklist Checking</Label>
                      <p className="text-sm text-gray-600">Check against known fraud lists</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Machine Learning</Label>
                      <p className="text-sm text-gray-600">AI-powered fraud detection</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment Plans</h2>
            <Button onClick={() => setShowAddPlan(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(paymentPlans || []).map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name || 'N/A'}</CardTitle>
                    <Badge className={getStatusColor(plan.status || 'inactive')}>
                      {plan.status || 'inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.currency || 'N/A'} {plan.price || 0}</span>
                    <span className="text-gray-600">/{plan.interval || 'N/A'}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Features</p>
                    <ul className="space-y-1">
                      {(plan.features || []).map((feature, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{plan.subscribers || 0} subscribers</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Plan Card */}
            <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer" onClick={() => setShowAddPlan(true)}>
              <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Plus className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Add New Plan</h3>
                <p className="text-sm text-gray-600">Create a new payment plan</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment Analytics</h2>
            <div className="flex gap-2">
              <Select defaultValue="30d">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Revenue chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Payment methods chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">96.8%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-xs text-green-600 mt-1">+2.1% vs last period</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">₹1,847</div>
                <div className="text-sm text-gray-600">Avg Transaction</div>
                <div className="text-xs text-green-600 mt-1">+5.3% vs last period</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">2.3%</div>
                <div className="text-sm text-gray-600">Refund Rate</div>
                <div className="text-xs text-red-600 mt-1">-0.8% vs last period</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600">4.2s</div>
                <div className="text-sm text-gray-600">Avg Processing</div>
                <div className="text-xs text-green-600 mt-1">-1.2s vs last period</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Gateway Dialog */}
      <Dialog open={showAddGateway} onOpenChange={setShowAddGateway}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment Gateway</DialogTitle>
            <DialogDescription>
              Configure a new payment gateway for your platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gateway-name">Gateway Name</Label>
                <Input id="gateway-name" placeholder="e.g., Razorpay Production" />
              </div>
              <div>
                <Label htmlFor="gateway-type">Gateway Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="payu">PayU</SelectItem>
                    <SelectItem value="cashfree">Cashfree</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" type="password" placeholder="Enter API key" />
              </div>
              <div>
                <Label htmlFor="secret-key">Secret Key</Label>
                <Input id="secret-key" type="password" placeholder="Enter secret key" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" placeholder="https://api.yoursite.com/webhooks/gateway" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="test-mode" />
              <Label htmlFor="test-mode">Enable Test Mode</Label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
              <Button className="flex-1">
                Save Gateway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Plan Dialog */}
      <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Payment Plan</DialogTitle>
            <DialogDescription>
              Set up a new subscription or payment plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input id="plan-name" placeholder="e.g., Premium Plan" />
              </div>
              <div>
                <Label htmlFor="plan-price">Price</Label>
                <Input id="plan-price" type="number" placeholder="999" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-currency">Currency</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plan-interval">Billing Interval</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="plan-features">Features (one per line)</Label>
              <Textarea 
                id="plan-features" 
                placeholder="Unlimited job postings&#10;Advanced analytics&#10;Priority support"
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="plan-active" defaultChecked />
              <Label htmlFor="plan-active">Activate plan immediately</Label>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddPlan(false)}>
                Cancel
              </Button>
              <Button className="flex-1">
                Create Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}