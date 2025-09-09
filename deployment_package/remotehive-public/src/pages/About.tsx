import React from 'react'
import { motion } from 'framer-motion'
import { Users, Target, Award, Globe, Heart, Zap, Shield, TrendingUp } from 'lucide-react'

const About: React.FC = () => {
  const stats = [
    { label: 'Active Users', value: '50,000+', icon: Users },
    { label: 'Jobs Posted', value: '25,000+', icon: Target },
    { label: 'Success Stories', value: '15,000+', icon: Award },
    { label: 'Countries', value: '50+', icon: Globe },
  ]

  const values = [
    {
      icon: Heart,
      title: 'People First',
      description: 'We believe in putting people at the center of everything we do, creating meaningful connections between talent and opportunities.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We continuously innovate to provide the best remote work experience, leveraging cutting-edge technology.',
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'We maintain the highest standards of security and transparency in all our interactions.',
    },
    {
      icon: TrendingUp,
      title: 'Growth',
      description: 'We are committed to the professional growth and success of every individual in our community.',
    },
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      bio: 'Former VP of Engineering at TechCorp with 15+ years in remote work advocacy.',
      avatar: '👩‍💼',
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      bio: 'Ex-Google engineer passionate about building scalable platforms for remote work.',
      avatar: '👨‍💻',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      bio: 'Product leader with expertise in user experience and remote collaboration tools.',
      avatar: '👩‍🎨',
    },
    {
      name: 'David Kim',
      role: 'Head of Growth',
      bio: 'Marketing strategist focused on connecting global talent with opportunities.',
      avatar: '👨‍🚀',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Connecting Global Talent with
              <span className="text-gradient block">Remote Opportunities</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              RemoteHive is the leading platform for remote work, connecting talented professionals 
              with companies that embrace the future of work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white mx-auto" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 gradient-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 mb-6">
                We believe the future of work is remote. Our mission is to democratize access to 
                global opportunities, enabling talented individuals to work from anywhere while 
                helping companies build diverse, distributed teams.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Founded in 2020, RemoteHive has grown from a simple job board to a comprehensive 
                platform that supports the entire remote work ecosystem - from job discovery to 
                career development.
              </p>
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="text-2xl font-bold text-blue-600">2020</div>
                  <div className="text-sm text-gray-600">Founded</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="text-2xl font-bold text-purple-600">50+</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Impact</h3>
                <p className="text-gray-600 mb-6">
                  We've helped thousands of professionals transition to remote work, 
                  enabling them to achieve better work-life balance while advancing their careers.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">15,000+ successful placements</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">2,500+ partner companies</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">50+ countries represented</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 gradient-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The passionate people behind RemoteHive</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Join the Remote Revolution</h2>
          <p className="text-xl mb-8 opacity-90">
            Whether you're looking for your next opportunity or seeking top talent, 
            RemoteHive is here to help you succeed in the remote work world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
            >
              Get Started Today
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About