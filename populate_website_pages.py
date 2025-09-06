#!/usr/bin/env python3
"""
Populate CMS with all website pages for complete admin panel control
"""

import os
import sys
from datetime import datetime
from typing import Dict, List, Any

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from core.database import get_supabase, get_supabase_admin
from core.config import settings

def create_website_pages():
    """Create all website pages in CMS for admin panel management"""
    
    try:
        # Initialize Supabase clients
        supabase = get_supabase()
        supabase_admin = get_supabase_admin()
        
        print("🚀 Starting website pages population...")
        
        # Define all website pages with their content structure
        website_pages = [
            {
                'title': 'Home Page',
                'slug': 'home',
                'path': '/',
                'content': {
                    'hero': {
                        'title': 'Find Your Dream Remote Job',
                        'subtitle': 'Connect with top companies offering remote opportunities worldwide. Your next career move is just a click away.',
                        'cta_text': 'Start Your Search',
                        'background_image': '/hero-bg.jpg'
                    },
                    'stats': [
                        {'label': 'Active Jobs', 'value': '10,000+', 'icon': 'briefcase'},
                        {'label': 'Companies', 'value': '2,500+', 'icon': 'users'},
                        {'label': 'Success Rate', 'value': '95%', 'icon': 'trending-up'},
                        {'label': 'Countries', 'value': '50+', 'icon': 'map-pin'}
                    ],
                    'features': [
                        {
                            'title': 'Remote-First Jobs',
                            'description': 'Curated remote opportunities from top companies worldwide',
                            'icon': '🌍'
                        },
                        {
                            'title': 'Smart Matching',
                            'description': 'AI-powered job recommendations based on your skills and preferences',
                            'icon': '🤖'
                        },
                        {
                            'title': 'Instant Applications',
                            'description': 'Apply to multiple jobs with one click using your profile',
                            'icon': '⚡'
                        },
                        {
                            'title': 'Career Growth',
                            'description': 'Access to mentorship, courses, and career development resources',
                            'icon': '📈'
                        }
                    ],
                    'testimonials': [
                        {
                            'name': 'Sarah Johnson',
                            'role': 'Software Engineer',
                            'company': 'TechCorp',
                            'content': 'RemoteHive helped me find my dream remote job in just 2 weeks. The platform is amazing!',
                            'avatar': '👩‍💻'
                        },
                        {
                            'name': 'Michael Chen',
                            'role': 'Product Manager',
                            'company': 'StartupXYZ',
                            'content': 'As an employer, RemoteHive connects us with top talent from around the world.',
                            'avatar': '👨‍💼'
                        },
                        {
                            'name': 'Emily Rodriguez',
                            'role': 'UX Designer',
                            'company': 'DesignStudio',
                            'content': 'The quality of remote opportunities on RemoteHive is unmatched.',
                            'avatar': '👩‍🎨'
                        }
                    ],
                    'company_logos': [
                        {'name': 'Google', 'logo': '/logos/google.svg'},
                        {'name': 'Microsoft', 'logo': '/logos/microsoft.svg'},
                        {'name': 'Amazon', 'logo': '/logos/amazon.svg'},
                        {'name': 'Apple', 'logo': '/logos/apple.svg'},
                        {'name': 'Meta', 'logo': '/logos/meta.svg'},
                        {'name': 'Netflix', 'logo': '/logos/netflix.svg'},
                        {'name': 'Spotify', 'logo': '/logos/spotify.svg'},
                        {'name': 'Airbnb', 'logo': '/logos/airbnb.svg'}
                    ]
                },
                'meta_title': 'RemoteHive - Find Your Perfect Remote Job',
                'meta_description': 'Discover thousands of remote job opportunities from top companies worldwide. Join RemoteHive today and work from anywhere.',
                'is_published': True,
                'page_type': 'landing'
            },
            {
                'title': 'About Us',
                'slug': 'about',
                'path': '/about',
                'content': {
                    'hero': {
                        'title': 'About RemoteHive',
                        'subtitle': 'Connecting talented professionals with remote opportunities worldwide',
                        'background_image': '/about-hero.jpg'
                    },
                    'mission': {
                        'title': 'Our Mission',
                        'description': 'To democratize access to remote work opportunities and help companies build diverse, distributed teams.',
                        'vision': 'A world where talent knows no geographical boundaries'
                    },
                    'story': {
                        'founded': '2020',
                        'countries': '50+',
                        'success_rate': '95%',
                        'description': 'Founded in 2020, RemoteHive has grown from a simple job board to a comprehensive platform that supports the entire remote work ecosystem.'
                    },
                    'team': [
                        {
                            'name': 'Alex Johnson',
                            'role': 'CEO & Founder',
                            'bio': 'Former remote work advocate with 10+ years in tech recruitment',
                            'image': '/team/alex.jpg'
                        },
                        {
                            'name': 'Sarah Chen',
                            'role': 'CTO',
                            'bio': 'Tech leader passionate about building scalable remote work solutions',
                            'image': '/team/sarah.jpg'
                        },
                        {
                            'name': 'Michael Rodriguez',
                            'role': 'Head of Operations',
                            'bio': 'Operations expert focused on creating seamless user experiences',
                            'image': '/team/michael.jpg'
                        }
                    ],
                    'values': [
                        {
                            'title': 'Transparency',
                            'description': 'We believe in open communication and honest practices',
                            'icon': '🔍'
                        },
                        {
                            'title': 'Innovation',
                            'description': 'Constantly improving our platform with cutting-edge technology',
                            'icon': '💡'
                        },
                        {
                            'title': 'Inclusivity',
                            'description': 'Creating opportunities for everyone, regardless of location',
                            'icon': '🌍'
                        },
                        {
                            'title': 'Quality',
                            'description': 'Curating only the best remote opportunities and talent',
                            'icon': '⭐'
                        }
                    ]
                },
                'meta_title': 'About RemoteHive - Our Mission & Story',
                'meta_description': 'Learn about RemoteHive\'s mission to connect remote talent with global opportunities. Discover our story, team, and values.',
                'is_published': True,
                'page_type': 'content'
            },
            {
                'title': 'Contact Us',
                'slug': 'contact',
                'path': '/contact',
                'content': {
                    'hero': {
                        'title': 'Get in Touch',
                        'subtitle': 'Have questions about RemoteHive? Need help with your account? We\'re here to help you succeed in your remote work journey.'
                    },
                    'contact_info': [
                        {
                            'type': 'email',
                            'label': 'Email Us',
                            'value': 'hello@remotehive.com',
                            'description': 'General inquiries and support',
                            'icon': 'mail'
                        },
                        {
                            'type': 'phone',
                            'label': 'Call Us',
                            'value': '+1 (555) 123-4567',
                            'description': 'Monday to Friday, 9 AM - 6 PM PST',
                            'icon': 'phone'
                        },
                        {
                            'type': 'address',
                            'label': 'Visit Us',
                            'value': 'San Francisco, CA',
                            'description': 'By appointment only',
                            'icon': 'map-pin'
                        },
                        {
                            'type': 'support',
                            'label': 'Support Center',
                            'value': 'help.remotehive.com',
                            'description': '24/7 self-service support',
                            'icon': 'help-circle'
                        }
                    ],
                    'faq': [
                        {
                            'question': 'How do I post a job on RemoteHive?',
                            'answer': 'Simply create an employer account, complete your company profile, and use our job posting wizard to create and publish your listing.'
                        },
                        {
                            'question': 'Is RemoteHive free for job seekers?',
                            'answer': 'Yes! Job seekers can create profiles, search jobs, and apply to positions completely free of charge.'
                        },
                        {
                            'question': 'How do you verify remote job listings?',
                            'answer': 'We have a dedicated team that reviews all job postings to ensure they are legitimate remote opportunities from verified companies.'
                        },
                        {
                            'question': 'Can I edit my profile after creating it?',
                            'answer': 'Absolutely! You can update your profile, skills, experience, and preferences at any time from your dashboard.'
                        }
                    ]
                },
                'meta_title': 'Contact RemoteHive - Get Help & Support',
                'meta_description': 'Contact RemoteHive for support, questions, or feedback. Multiple ways to reach our team and get the help you need.',
                'is_published': True,
                'page_type': 'contact'
            },
            {
                'title': 'Pricing Plans',
                'slug': 'pricing',
                'path': '/pricing',
                'content': {
                    'hero': {
                        'title': 'Simple, Transparent Pricing',
                        'subtitle': 'Choose the perfect plan for your hiring needs. No hidden fees, cancel anytime.'
                    },
                    'plans': [
                        {
                            'name': 'Starter',
                            'price': 99,
                            'period': 'month',
                            'description': 'Perfect for small companies just getting started with remote hiring',
                            'features': [
                                '5 job postings per month',
                                'Basic candidate filtering',
                                'Email support',
                                'Standard job visibility',
                                'Basic analytics'
                            ],
                            'popular': False
                        },
                        {
                            'name': 'Professional',
                            'price': 199,
                            'period': 'month',
                            'description': 'Ideal for growing companies with regular hiring needs',
                            'features': [
                                '15 job postings per month',
                                'Advanced candidate filtering',
                                'Priority support',
                                'Featured job listings',
                                'Advanced analytics',
                                'Custom branding',
                                'ATS integration'
                            ],
                            'popular': True
                        },
                        {
                            'name': 'Enterprise',
                            'price': 499,
                            'period': 'month',
                            'description': 'For large organizations with extensive hiring requirements',
                            'features': [
                                'Unlimited job postings',
                                'AI-powered matching',
                                'Dedicated account manager',
                                'Premium job placement',
                                'Custom analytics dashboard',
                                'White-label solution',
                                'API access',
                                'Custom integrations'
                            ],
                            'popular': False
                        }
                    ],
                    'features_comparison': {
                        'job_postings': ['5/month', '15/month', 'Unlimited'],
                        'candidate_filtering': ['Basic', 'Advanced', 'AI-Powered'],
                        'support': ['Email', 'Priority', 'Dedicated Manager'],
                        'analytics': ['Basic', 'Advanced', 'Custom Dashboard'],
                        'branding': ['Standard', 'Custom', 'White-label']
                    },
                    'faq': [
                        {
                            'question': 'Can I change my plan anytime?',
                            'answer': 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
                        },
                        {
                            'question': 'Do you offer refunds?',
                            'answer': 'We offer a 30-day money-back guarantee for all new subscriptions.'
                        },
                        {
                            'question': 'What payment methods do you accept?',
                            'answer': 'We accept all major credit cards, PayPal, and bank transfers for enterprise plans.'
                        }
                    ]
                },
                'meta_title': 'RemoteHive Pricing - Choose Your Perfect Plan',
                'meta_description': 'Transparent pricing for remote job posting. Choose from Starter, Professional, or Enterprise plans. 30-day money-back guarantee.',
                'is_published': True,
                'page_type': 'pricing'
            },
            {
                'title': 'Job Feed',
                'slug': 'jobs',
                'path': '/jobs',
                'content': {
                    'hero': {
                        'title': 'Remote Job Opportunities',
                        'subtitle': 'Discover your next remote career opportunity from our curated list of verified companies.'
                    },
                    'filters': {
                        'categories': ['Engineering', 'Design', 'Marketing', 'Sales', 'Customer Support', 'Data Science', 'Product Management'],
                        'experience_levels': ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'],
                        'job_types': ['Full-time', 'Part-time', 'Contract', 'Freelance'],
                        'salary_ranges': ['$30k-50k', '$50k-75k', '$75k-100k', '$100k-150k', '$150k+']
                    },
                    'featured_companies': [
                        {'name': 'TechCorp', 'logo': '/companies/techcorp.svg', 'jobs_count': 12},
                        {'name': 'StartupXYZ', 'logo': '/companies/startupxyz.svg', 'jobs_count': 8},
                        {'name': 'DesignStudio', 'logo': '/companies/designstudio.svg', 'jobs_count': 5}
                    ]
                },
                'meta_title': 'Remote Jobs - Find Your Perfect Remote Career',
                'meta_description': 'Browse thousands of verified remote job opportunities. Filter by category, experience level, and salary. Apply with one click.',
                'is_published': True,
                'page_type': 'listing'
            },
            {
                'title': 'Blog',
                'slug': 'blogs',
                'path': '/blogs',
                'content': {
                    'hero': {
                        'title': 'Remote Work Insights',
                        'subtitle': 'Stay updated with the latest trends, tips, and insights about remote work and career development.'
                    },
                    'categories': [
                        {'name': 'Remote Work Tips', 'slug': 'remote-work-tips', 'count': 25},
                        {'name': 'Career Development', 'slug': 'career-development', 'count': 18},
                        {'name': 'Company Culture', 'slug': 'company-culture', 'count': 12},
                        {'name': 'Technology', 'slug': 'technology', 'count': 15},
                        {'name': 'Productivity', 'slug': 'productivity', 'count': 20}
                    ],
                    'featured_posts': [
                        {
                            'title': '10 Essential Tools for Remote Workers',
                            'excerpt': 'Discover the must-have tools that will boost your productivity while working remotely.',
                            'author': 'Sarah Johnson',
                            'date': '2024-01-15',
                            'image': '/blog/remote-tools.jpg',
                            'category': 'Remote Work Tips'
                        },
                        {
                            'title': 'Building a Strong Remote Team Culture',
                            'excerpt': 'Learn how to foster team collaboration and maintain company culture in a distributed workforce.',
                            'author': 'Michael Chen',
                            'date': '2024-01-12',
                            'image': '/blog/team-culture.jpg',
                            'category': 'Company Culture'
                        }
                    ]
                },
                'meta_title': 'Remote Work Blog - Tips, Insights & Career Advice',
                'meta_description': 'Read expert insights on remote work, career development, and productivity. Stay ahead with the latest remote work trends.',
                'is_published': True,
                'page_type': 'blog'
            }
        ]
        
        # Insert pages into CMS
        for page_data in website_pages:
            try:
                # Check if page already exists
                existing = supabase_admin.table('cms_pages').select('id').eq('slug', page_data['slug']).execute()
                
                if existing.data:
                    # Update existing page
                    result = supabase_admin.table('cms_pages').update({
                        'title': page_data['title'],
                        'content': page_data['content'],
                        'meta_title': page_data['meta_title'],
                        'meta_description': page_data['meta_description'],
                        'is_published': page_data['is_published'],
                        'page_type': page_data['page_type'],
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('slug', page_data['slug']).execute()
                    
                    print(f"✅ Updated page: {page_data['title']}")
                else:
                    # Insert new page
                    result = supabase_admin.table('cms_pages').insert({
                        'title': page_data['title'],
                        'slug': page_data['slug'],
                        'content': page_data['content'],
                        'meta_title': page_data['meta_title'],
                        'meta_description': page_data['meta_description'],
                        'is_published': page_data['is_published'],
                        'page_type': page_data['page_type'],
                        'created_at': datetime.utcnow().isoformat(),
                        'updated_at': datetime.utcnow().isoformat()
                    }).execute()
                    
                    print(f"✅ Created page: {page_data['title']}")
                    
            except Exception as e:
                print(f"❌ Error processing page {page_data['title']}: {str(e)}")
        
        # Update SEO settings
        try:
            seo_data = {
                'site_title': 'RemoteHive - Find Your Perfect Remote Job',
                'meta_description': 'Discover thousands of remote job opportunities from top companies worldwide. Join RemoteHive today and work from anywhere.',
                'keywords': 'remote jobs, work from home, remote work, telecommute, digital nomad, remote career, distributed teams',
                'og_image': '/og-image.jpg',
                'twitter_card': 'summary_large_image',
                'canonical_url': 'https://remotehive.com',
                'robots_txt': 'User-agent: *\nAllow: /\nSitemap: https://remotehive.com/sitemap.xml',
                'sitemap_enabled': True,
                'analytics_id': 'GA-XXXXXXXXX',
                'search_console_id': 'SC-XXXXXXXXX',
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Check if SEO settings exist
            existing_seo = supabase_admin.table('seo_settings').select('id').limit(1).execute()
            
            if existing_seo.data:
                # Update existing SEO settings
                supabase_admin.table('seo_settings').update(seo_data).eq('id', existing_seo.data[0]['id']).execute()
                print("✅ Updated SEO settings")
            else:
                # Insert new SEO settings
                seo_data['created_at'] = datetime.utcnow().isoformat()
                supabase_admin.table('seo_settings').insert(seo_data).execute()
                print("✅ Created SEO settings")
                
        except Exception as e:
            print(f"❌ Error updating SEO settings: {str(e)}")
        
        # Add sample reviews
        sample_reviews = [
            {
                'author_name': 'Sarah Johnson',
                'author_email': 'sarah.j@email.com',
                'rating': 5,
                'title': 'Amazing Platform!',
                'content': 'RemoteHive helped me find my dream remote job in just 2 weeks. The platform is intuitive and the job quality is excellent.',
                'is_approved': True,
                'is_featured': True,
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'author_name': 'Michael Chen',
                'author_email': 'michael.c@email.com',
                'rating': 5,
                'title': 'Great for Employers',
                'content': 'As an employer, RemoteHive connects us with top talent from around the world. Highly recommended!',
                'is_approved': True,
                'is_featured': True,
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'author_name': 'Emily Rodriguez',
                'author_email': 'emily.r@email.com',
                'rating': 4,
                'title': 'Quality Remote Opportunities',
                'content': 'The quality of remote opportunities on RemoteHive is unmatched. Found several great positions to apply for.',
                'is_approved': True,
                'is_featured': False,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        for review in sample_reviews:
            try:
                # Check if review already exists
                existing = supabase_admin.table('reviews').select('id').eq('author_email', review['author_email']).execute()
                
                if not existing.data:
                    supabase_admin.table('reviews').insert(review).execute()
                    print(f"✅ Added review from {review['author_name']}")
                else:
                    print(f"⏭️  Review from {review['author_name']} already exists")
                    
            except Exception as e:
                print(f"❌ Error adding review from {review['author_name']}: {str(e)}")
        
        # Add sample ads
        sample_ads = [
            {
                'name': 'Google AdSense - Header Banner',
                'ad_type': 'google_adsense',
                'position': 'header',
                'content': '<div class="ad-banner">Google AdSense Header Banner</div>',
                'is_active': True,
                'target_url': 'https://www.google.com/adsense',
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'name': 'Meta Ads - Sidebar',
                'ad_type': 'meta_ads',
                'position': 'sidebar',
                'content': '<div class="ad-sidebar">Meta Ads Sidebar</div>',
                'is_active': True,
                'target_url': 'https://www.facebook.com/business/ads',
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'name': 'Footer Promotion',
                'ad_type': 'custom',
                'position': 'footer',
                'content': '<div class="footer-promo">Join RemoteHive Premium for exclusive features!</div>',
                'is_active': True,
                'target_url': '/pricing',
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        for ad in sample_ads:
            try:
                # Check if ad already exists
                existing = supabase_admin.table('ads').select('id').eq('name', ad['name']).execute()
                
                if not existing.data:
                    supabase_admin.table('ads').insert(ad).execute()
                    print(f"✅ Added ad: {ad['name']}")
                else:
                    print(f"⏭️  Ad {ad['name']} already exists")
                    
            except Exception as e:
                print(f"❌ Error adding ad {ad['name']}: {str(e)}")
        
        print("\n🎉 Website pages population completed successfully!")
        print("\n📊 Summary:")
        
        # Get final counts
        pages_count = supabase_admin.table('cms_pages').select('id', count='exact').execute()
        reviews_count = supabase_admin.table('reviews').select('id', count='exact').execute()
        ads_count = supabase_admin.table('ads').select('id', count='exact').execute()
        seo_count = supabase_admin.table('seo_settings').select('id', count='exact').execute()
        
        print(f"   • CMS Pages: {pages_count.count}")
        print(f"   • Reviews: {reviews_count.count}")
        print(f"   • Ads: {ads_count.count}")
        print(f"   • SEO Settings: {seo_count.count}")
        
        print("\n🔗 All website pages are now connected to the admin panel!")
        print("   • Access the Website Manager at: http://localhost:3001/admin/website-manager")
        print("   • Edit content, images, text, and company logos")
        print("   • Manage reviews and advertisements")
        print("   • Control SEO settings and meta data")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_website_pages()