import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Tag, Search, TrendingUp, BookOpen, Coffee } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  authorAvatar: string
  publishedAt: string
  readTime: number
  category: string
  tags: string[]
  featured: boolean
  image: string
}

const Blogs: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['All', 'Remote Work', 'Career Tips', 'Technology', 'Productivity', 'Company Culture', 'Interviews']

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Ultimate Guide to Remote Work Success in 2024',
      excerpt: 'Discover the essential strategies, tools, and mindset shifts needed to thrive in remote work environments.',
      content: '',
      author: 'Sarah Johnson',
      authorAvatar: '👩‍💼',
      publishedAt: '2024-01-15',
      readTime: 8,
      category: 'Remote Work',
      tags: ['remote work', 'productivity', 'work-life balance'],
      featured: true,
      image: '🏠',
    },
    {
      id: '2',
      title: 'How to Ace Your Remote Job Interview',
      excerpt: 'Master the art of virtual interviews with these proven tips and techniques from hiring managers.',
      content: '',
      author: 'Michael Chen',
      authorAvatar: '👨‍💻',
      publishedAt: '2024-01-12',
      readTime: 6,
      category: 'Interviews',
      tags: ['interviews', 'career tips', 'job search'],
      featured: true,
      image: '💼',
    },
    {
      id: '3',
      title: 'Building a Strong Remote Team Culture',
      excerpt: 'Learn how successful companies create engaging and inclusive cultures in distributed teams.',
      content: '',
      author: 'Emily Rodriguez',
      authorAvatar: '👩‍🎨',
      publishedAt: '2024-01-10',
      readTime: 10,
      category: 'Company Culture',
      tags: ['team culture', 'management', 'remote teams'],
      featured: false,
      image: '🤝',
    },
    {
      id: '4',
      title: 'Top 10 Remote Work Tools for 2024',
      excerpt: 'Explore the latest tools and technologies that are revolutionizing remote work productivity.',
      content: '',
      author: 'David Kim',
      authorAvatar: '👨‍🚀',
      publishedAt: '2024-01-08',
      readTime: 7,
      category: 'Technology',
      tags: ['tools', 'technology', 'productivity'],
      featured: false,
      image: '🛠️',
    },
    {
      id: '5',
      title: 'Maintaining Work-Life Balance While Working Remotely',
      excerpt: 'Practical strategies to set boundaries and maintain mental health in a remote work environment.',
      content: '',
      author: 'Lisa Wang',
      authorAvatar: '👩‍⚕️',
      publishedAt: '2024-01-05',
      readTime: 9,
      category: 'Productivity',
      tags: ['work-life balance', 'mental health', 'wellness'],
      featured: false,
      image: '⚖️',
    },
    {
      id: '6',
      title: 'Transitioning from Office to Remote: A Complete Guide',
      excerpt: 'Everything you need to know about making the switch from traditional office work to remote.',
      content: '',
      author: 'Alex Thompson',
      authorAvatar: '👨‍🎓',
      publishedAt: '2024-01-03',
      readTime: 12,
      category: 'Career Tips',
      tags: ['career transition', 'remote work', 'professional development'],
      featured: false,
      image: '🔄',
    },
  ]

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const featuredPosts = blogPosts.filter(post => post.featured)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="gradient-bg py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Remote Work
              <span className="text-gradient block">Insights & Tips</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stay ahead with the latest trends, tips, and insights from the world of remote work. 
              Learn from experts and successful remote professionals.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search articles, topics, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === 'All' && (
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-8">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-3xl font-bold text-gray-900">Featured Articles</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {featuredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-8">
                    <div className="text-6xl mb-4">{post.image}</div>
                    <div className="flex items-center mb-4">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                      <span className="ml-auto text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime} min read
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                      <a href={`/blog/${post.id}`}>{post.title}</a>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{post.authorAvatar}</span>
                        <div>
                          <div className="font-medium text-gray-900">{post.author}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(post.publishedAt)}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Read More →
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">
              {selectedCategory === 'All' ? 'Latest Articles' : `${selectedCategory} Articles`}
            </h2>
            <span className="ml-4 text-gray-500">({filteredPosts.length} articles)</span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="text-4xl mb-4">{post.image}</div>
                    <div className="flex items-center mb-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                        {post.category}
                      </span>
                      <span className="ml-auto text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime} min
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors line-clamp-2">
                      <a href={`/blog/${post.id}`}>{post.title}</a>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{post.excerpt}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{post.authorAvatar}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{post.author}</div>
                          <div className="text-xs text-gray-500">{formatDate(post.publishedAt)}</div>
                        </div>
                      </div>
                      <a
                        href={`/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        Read →
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl mb-8 opacity-90">
            Get the latest remote work insights, tips, and job opportunities delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Blogs