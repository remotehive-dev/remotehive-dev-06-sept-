import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Lock, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react'
import { paymentService, PaymentData } from '../lib/paymentService'
import toast from 'react-hot-toast'

interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
}

interface PaymentMethod {
  id: string
  name: string
  icon: string
  description: string
}

const Checkout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    company: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  })

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for job seekers getting started',
      features: ['Browse unlimited jobs', 'Apply to 5 jobs per month', 'Basic profile creation']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 299,
      period: 'per month',
      description: 'For serious job seekers who want more opportunities',
      features: ['Everything in Free', 'Unlimited job applications', 'Advanced search filters']
    },
    {
      id: 'business',
      name: 'Business',
      price: 2999,
      period: 'per month',
      description: 'For small to medium companies hiring remote talent',
      features: ['Post up to 10 jobs per month', 'Access to candidate database', 'Basic applicant tracking']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 9999,
      period: 'per month',
      description: 'For large organizations with extensive hiring needs',
      features: ['Everything in Business', 'Unlimited job postings', 'Advanced applicant tracking system']
    }
  ]

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, RuPay'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: '📱',
      description: 'Pay using UPI ID or QR code'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'All major banks supported'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: '💰',
      description: 'Paytm, PhonePe, Google Pay'
    }
  ]

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const planId = searchParams.get('plan')
    if (planId) {
      const plan = plans.find(p => p.id === planId)
      if (plan) {
        setSelectedPlan(plan)
      }
    }
  }, [location])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name.startsWith('billing.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePayment = async () => {
    if (!selectedPlan) return
    
    if (!formData.email || !formData.fullName) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const paymentData: PaymentData = {
        plan: selectedPlan.id,
        amount: selectedPlan.price,
        currency: 'INR',
        customer_email: formData.email,
        customer_name: formData.fullName,
        customer_phone: '',
        billing_address: {
          line1: formData.billingAddress.street,
          city: formData.billingAddress.city,
          state: formData.billingAddress.state,
          postal_code: formData.billingAddress.zipCode,
          country: formData.billingAddress.country
        },
        gateway: selectedPaymentMethod === 'card' ? 'stripe' : 'razorpay'
      }
      
      let paymentResult
      
      if (selectedPaymentMethod === 'card') {
        // Process with Stripe
        paymentResult = await paymentService.processStripePayment(paymentData)
      } else {
        // Process with Razorpay for UPI, Net Banking, Wallet
        paymentResult = await paymentService.processRazorpayPayment(paymentData)
      }
      
      // Save transaction to database
      const transaction = await paymentService.saveTransaction({
        payment_intent_id: paymentResult.id,
        amount: selectedPlan.price,
        currency: 'INR',
        status: 'pending',
        gateway: paymentData.gateway,
        customer_email: formData.email,
        plan_name: selectedPlan.name
      })
      
      // Redirect to success page with payment details
      navigate('/payment-success', {
        state: {
          paymentIntent: paymentResult,
          transaction,
          customerInfo: formData,
          plan: selectedPlan.name
        }
      })
    } catch (error) {
      console.error('Payment failed:', error)
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const calculateTax = (amount: number) => {
    return Math.round(amount * 0.18) // 18% GST
  }

  const calculateTotal = () => {
    if (!selectedPlan) return 0
    const tax = calculateTax(selectedPlan.price)
    return selectedPlan.price + tax
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Plan Selected</h2>
          <p className="text-gray-600 mb-6">Please select a plan from our pricing page.</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Pricing Plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          <p className="text-gray-600 mt-2">Secure checkout powered by industry-leading encryption</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Details (shown only for card payment) */}
              {selectedPaymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    name="billing.street"
                    value={formData.billingAddress.street}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="billing.city"
                    value={formData.billingAddress.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="billing.state"
                    value={formData.billingAddress.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="billing.zipCode"
                    value={formData.billingAddress.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    name="billing.country"
                    value={formData.billingAddress.country}
                    onChange={(e) => handleInputChange(e as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-900">{selectedPlan.name} Plan</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedPlan.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Subscription</span>
                    <span className="font-medium">₹{selectedPlan.price.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span>₹{selectedPlan.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">GST (18%)</span>
                    <span>₹{calculateTax(selectedPlan.price).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-semibold text-gray-900">₹{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Lock className="w-5 h-5 mr-2" />
                        Complete Payment
                      </div>
                    )}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <Lock className="w-4 h-4 mr-1" />
                    Secured by 256-bit SSL encryption
                  </div>
                </div>

                {/* Features included */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout