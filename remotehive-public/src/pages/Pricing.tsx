import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Star, ArrowRight, Users, Briefcase, Building2, Crown } from 'lucide-react'

const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for job seekers getting started',
      icon: Users,
      color: 'from-gray-500 to-gray-600',
      popular: false,
      features: [
        { name: 'Browse unlimited jobs', included: true },
        { name: 'Apply to 5 jobs per month', included: true },
        { name: 'Basic profile creation', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Priority support', included: false },
        { name: 'Advanced filters', included: false },
        { name: 'Profile analytics', included: false },
        { name: 'Resume builder', included: false },
        { name: 'Interview preparation', included: false }
      ],
      cta: 'Get Started Free',
      link: '/register?plan=free'
    },
    {
      name: 'Pro',
      price: '₹299',
      period: 'per month',
      description: 'For serious job seekers who want more opportunities',
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      popular: true,
      features: [
        { name: 'Everything in Free', included: true },
        { name: 'Unlimited job applications', included: true },
        { name: 'Advanced search filters', included: true },
        { name: 'Profile analytics & insights', included: true },
        { name: 'Resume builder with templates', included: true },
        { name: 'Priority customer support', included: true },
        { name: 'Application tracking', included: true },
        { name: 'Salary insights', included: true },
        { name: 'Interview preparation resources', included: true },
        { name: 'Profile visibility boost', included: true }
      ],
      cta: 'Start Pro Trial',
      link: '/checkout?plan=pro&price=299&period=month'
    },
    {
      name: 'Business',
      price: '₹2,999',
      period: 'per month',
      description: 'For small to medium companies hiring remote talent',
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      popular: false,
      features: [
        { name: 'Post up to 10 jobs per month', included: true },
        { name: 'Access to candidate database', included: true },
        { name: 'Basic applicant tracking', included: true },
        { name: 'Company profile page', included: true },
        { name: 'Email support', included: true },
        { name: 'Job posting templates', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Candidate screening tools', included: false },
        { name: 'Advanced ATS integration', included: false },
        { name: 'Dedicated account manager', included: false }
      ],
      cta: 'Start Hiring',
      link: '/checkout?plan=business&price=2999&period=month'
    },
    {
      name: 'Enterprise',
      price: '₹9,999',
      period: 'per month',
      description: 'For large organizations with extensive hiring needs',
      icon: Crown,
      color: 'from-orange-500 to-red-500',
      popular: false,
      features: [
        { name: 'Everything in Business', included: true },
        { name: 'Unlimited job postings', included: true },
        { name: 'Advanced applicant tracking system', included: true },
        { name: 'Candidate screening & assessment tools', included: true },
        { name: 'Custom integrations (ATS, HRIS)', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Priority support (24/7)', included: true },
        { name: 'Advanced analytics & reporting', included: true },
        { name: 'White-label solutions', included: true },
        { name: 'Custom onboarding & training', included: true }
      ],
      cta: 'Contact Sales',
      link: '/contact?plan=enterprise'
    }
  ]

  const faqs = [
    {
      question: 'Can I change my plan anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
    },
    {
      question: 'Is there a free trial for paid plans?',
      answer: 'Yes, we offer a 14-day free trial for Pro and Business plans. No credit card required to start.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets for Indian customers.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans if you\'re not satisfied with our service.'
    },
    {
      question: 'Can I get a custom plan for my organization?',
      answer: 'Absolutely! For large organizations with specific needs, we can create custom plans. Contact our sales team for more details.'
    },
    {
      question: 'Are there any setup fees?',
      answer: 'No, there are no setup fees or hidden charges. You only pay the monthly subscription fee for your chosen plan.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl opacity-90 mb-8"
          >
            Choose the perfect plan for your remote work journey. No hidden fees, cancel anytime.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center space-x-8 text-sm"
          >
            <span className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              14-day free trial
            </span>
            <span className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              No setup fees
            </span>
            <span className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              Cancel anytime
            </span>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                    plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="p-8">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mr-3`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-500 ml-2">/{plan.period}</span>
                      </div>
                      <p className="text-gray-600 mt-2">{plan.description}</p>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link
                      to={plan.link}
                      className={`block w-full text-center py-3 rounded-lg font-semibold transition-all duration-200 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare All Features</h2>
            <p className="text-xl text-gray-600">See what's included in each plan</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="text-center py-4 px-6">
                      <div className="font-semibold text-gray-900">{plan.name}</div>
                      <div className="text-sm text-gray-500">{plan.price}/{plan.period}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans[0].features.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-700">{feature.name}</td>
                    {plans.map((plan) => (
                      <td key={plan.name} className="py-4 px-6 text-center">
                        {plan.features[index]?.included ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Got questions? We've got answers.</p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of professionals and companies using RemoteHive to build amazing remote teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/checkout?plan=pro&price=299&period=month"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 inline-flex items-center justify-center"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Pricing