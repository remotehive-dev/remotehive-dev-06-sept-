import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Download, ArrowRight, Mail, Calendar } from 'lucide-react'

interface PaymentSuccessData {
  plan: {
    id: string
    name: string
    price: number
    period: string
  }
  transactionId: string
  customerEmail?: string
}

const PaymentSuccess = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get payment data from location state or URL params
    const stateData = location.state as PaymentSuccessData
    const searchParams = new URLSearchParams(location.search)
    
    if (stateData) {
      setPaymentData(stateData)
      setIsLoading(false)
    } else {
      // Try to get data from URL params (for redirect from payment gateway)
      const transactionId = searchParams.get('transaction_id')
      const planId = searchParams.get('plan_id')
      
      if (transactionId && planId) {
        // Fetch payment details from API
        fetchPaymentDetails(transactionId)
      } else {
        // No valid payment data, redirect to pricing
        navigate('/pricing')
      }
    }
  }, [location, navigate])

  const fetchPaymentDetails = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/payments/verify/${transactionId}`)
      const data = await response.json()
      
      if (data.success) {
        setPaymentData({
          plan: data.plan,
          transactionId: data.transactionId,
          customerEmail: data.customerEmail
        })
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (error) {
      console.error('Error fetching payment details:', error)
      navigate('/pricing')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadInvoice = async () => {
    if (!paymentData) return
    
    try {
      const response = await fetch(`/api/payments/invoice/${paymentData.transactionId}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${paymentData.transactionId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice. Please contact support.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find your payment details.</p>
          <Link
            to="/pricing"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-600 mb-2">
            Thank you for subscribing to the {paymentData.plan.name} plan
          </p>
          <p className="text-gray-500">
            Transaction ID: <span className="font-mono text-sm">{paymentData.transactionId}</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">{paymentData.plan.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">₹{paymentData.plan.price.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="font-medium">{paymentData.plan.period}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Payment Date</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={downloadInvoice}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Invoice
              </button>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Check Your Email</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We've sent a confirmation email with your subscription details and invoice.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Access Your Features</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your {paymentData.plan.name} plan features are now active and ready to use.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Subscription</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    You can manage your subscription, update payment methods, or cancel anytime from your dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <Link
                to="/dashboard"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              
              <Link
                to="/contact"
                className="block w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Contact Support
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 bg-blue-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">Billing Cycle</h4>
              <p>Your subscription will automatically renew every {paymentData.plan.period.replace('per ', '')}.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Cancellation</h4>
              <p>You can cancel your subscription anytime from your account settings.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Support</h4>
              <p>Need help? Contact our support team 24/7 via email or chat.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Refund Policy</h4>
              <p>30-day money-back guarantee if you're not satisfied with our service.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PaymentSuccess