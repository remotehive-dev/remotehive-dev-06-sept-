import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Video, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2, 
  Copy, 
  Share, 
  Bell, 
  BellOff, 
  Filter, 
  Search, 
  MoreHorizontal, 
  User, 
  Mail, 
  FileText, 
  Download, 
  Upload, 
  Settings, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Info, 
  ExternalLink, 
  Paperclip, 
  MessageSquare, 
  Zap, 
  Target, 
  Award, 
  TrendingUp, 
  Activity, 
  Grid, 
  List, 
  Calendar as CalendarView, 
  Columns, 
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ScheduleEvent {
  id: string;
  title: string;
  type: 'interview' | 'meeting' | 'call' | 'presentation' | 'other';
  start_time: string;
  end_time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  participants: {
    id: string;
    name: string;
    email: string;
    role: 'candidate' | 'interviewer' | 'recruiter' | 'manager' | 'other';
    avatar?: string;
    status: 'accepted' | 'pending' | 'declined' | 'tentative';
  }[];
  location?: {
    type: 'in-person' | 'video' | 'phone';
    details: string;
    meeting_link?: string;
    dial_in?: string;
  };
  description?: string;
  agenda?: string[];
  job_context?: {
    job_id: string;
    job_title: string;
    department: string;
  };
  interview_details?: {
    round: number;
    interview_type: 'technical' | 'behavioral' | 'cultural' | 'final' | 'screening';
    interviewer_notes?: string;
    candidate_resume?: string;
    evaluation_form?: string;
  };
  reminders: {
    time: number; // minutes before
    sent: boolean;
  }[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: Date;
}

const EmployerSchedule: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>({
    type: 'month',
    date: new Date()
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<ScheduleEvent | null>(null);

  // Mock data
  const mockEvents: ScheduleEvent[] = [
    {
      id: 'event_1',
      title: 'Technical Interview - Sarah Johnson',
      type: 'interview',
      start_time: '2024-01-22T10:00:00Z',
      end_time: '2024-01-22T11:30:00Z',
      duration: 90,
      status: 'confirmed',
      priority: 'high',
      participants: [
        {
          id: 'candidate_1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          role: 'candidate',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          status: 'accepted'
        },
        {
          id: 'interviewer_1',
          name: 'John Smith',
          email: 'john.smith@techcorp.com',
          role: 'interviewer',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          status: 'accepted'
        }
      ],
      location: {
        type: 'video',
        details: 'Zoom Meeting',
        meeting_link: 'https://zoom.us/j/123456789'
      },
      description: 'Technical interview for Senior React Developer position',
      agenda: [
        'Introduction and background (10 min)',
        'Technical questions (45 min)',
        'Coding challenge (30 min)',
        'Q&A session (5 min)'
      ],
      job_context: {
        job_id: 'job_1',
        job_title: 'Senior React Developer',
        department: 'Engineering'
      },
      interview_details: {
        round: 2,
        interview_type: 'technical',
        candidate_resume: '/files/sarah_johnson_resume.pdf'
      },
      reminders: [
        { time: 60, sent: false },
        { time: 15, sent: false }
      ],
      created_by: 'employer_1',
      created_at: '2024-01-20T09:00:00Z',
      updated_at: '2024-01-20T09:00:00Z'
    },
    {
      id: 'event_2',
      title: 'Team Standup',
      type: 'meeting',
      start_time: '2024-01-22T09:00:00Z',
      end_time: '2024-01-22T09:30:00Z',
      duration: 30,
      status: 'scheduled',
      priority: 'medium',
      participants: [
        {
          id: 'team_1',
          name: 'Engineering Team',
          email: 'engineering@techcorp.com',
          role: 'other',
          status: 'accepted'
        }
      ],
      location: {
        type: 'video',
        details: 'Google Meet',
        meeting_link: 'https://meet.google.com/abc-defg-hij'
      },
      description: 'Daily team standup meeting',
      reminders: [
        { time: 15, sent: false }
      ],
      created_by: 'employer_1',
      created_at: '2024-01-19T08:00:00Z',
      updated_at: '2024-01-19T08:00:00Z'
    },
    {
      id: 'event_3',
      title: 'Final Interview - Michael Chen',
      type: 'interview',
      start_time: '2024-01-23T14:00:00Z',
      end_time: '2024-01-23T15:00:00Z',
      duration: 60,
      status: 'scheduled',
      priority: 'high',
      participants: [
        {
          id: 'candidate_2',
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          role: 'candidate',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          status: 'pending'
        },
        {
          id: 'manager_1',
          name: 'Lisa Wang',
          email: 'lisa.wang@techcorp.com',
          role: 'manager',
          status: 'accepted'
        }
      ],
      location: {
        type: 'in-person',
        details: 'Conference Room A, 5th Floor'
      },
      description: 'Final interview with hiring manager',
      job_context: {
        job_id: 'job_2',
        job_title: 'Full Stack Engineer',
        department: 'Engineering'
      },
      interview_details: {
        round: 3,
        interview_type: 'final'
      },
      reminders: [
        { time: 120, sent: false },
        { time: 30, sent: false }
      ],
      created_by: 'employer_1',
      created_at: '2024-01-21T10:00:00Z',
      updated_at: '2024-01-21T10:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarView.date);
    
    switch (calendarView.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCalendarView({ ...calendarView, date: newDate });
  };

  const getCalendarTitle = () => {
    const date = calendarView.date;
    
    switch (calendarView.type) {
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'agenda':
        return 'Agenda View';
      default:
        return '';
    }
  };

  const getEventColor = (event: ScheduleEvent) => {
    switch (event.type) {
      case 'interview':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-green-500';
      case 'call':
        return 'bg-yellow-500';
      case 'presentation':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'rescheduled':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEventUpdate = (eventId: string, updates: Partial<ScheduleEvent>) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ));
    toast.success('Event updated successfully');
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
    setShowEventModal(false);
    toast.success('Event deleted successfully');
  };

  const generateCalendarDays = () => {
    const date = new Date(calendarView.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600 mt-1">Manage your interviews and meetings</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={() => setShowNewEventModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="interview">Interviews</option>
                  <option value="meeting">Meetings</option>
                  <option value="call">Calls</option>
                  <option value="presentation">Presentations</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateCalendar('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                  {getCalendarTitle()}
                </h2>
                <button
                  onClick={() => navigateCalendar('next')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <button
                onClick={() => setCalendarView({ ...calendarView, date: new Date() })}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Today
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              {['month', 'week', 'day', 'agenda'].map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setCalendarView({ ...calendarView, type: viewType as any })}
                  className={`px-3 py-2 text-sm rounded-lg capitalize ${
                    calendarView.type === viewType
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Calendar Grid */}
        {calendarView.type === 'month' && (
          <div className="p-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => {
                const isCurrentMonth = day.getMonth() === calendarView.date.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                const dayEvents = getEventsForDate(day);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${
                            getEventColor(event)
                          }`}
                        >
                          {formatTime(event.start_time)} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Agenda View */}
        {calendarView.type === 'agenda' && (
          <div className="p-4">
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No events found</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-4 h-4 rounded-full mt-1 ${getEventColor(event)}`}></div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                            <span className={`text-sm ${getPriorityColor(event.priority)}`}>
                              {event.priority} priority
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(event.start_time).toLocaleDateString()} at {formatTime(event.start_time)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{event.participants.length} participants</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                {event.location.type === 'video' ? <Video className="h-4 w-4" /> :
                                 event.location.type === 'phone' ? <Phone className="h-4 w-4" /> :
                                 <MapPin className="h-4 w-4" />}
                                <span>{event.location.details}</span>
                              </div>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-600">{event.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            </div>
            
            <div className="p-6">
              {filteredEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  <div className={`w-3 h-3 rounded-full ${getEventColor(event)}`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatTime(event.start_time)} ({formatDuration(event.duration)})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      {event.participants.length > 0 && (
                        <span className="text-xs text-gray-500">
                          with {event.participants[0].name}
                          {event.participants.length > 1 && ` +${event.participants.length - 1} others`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Events</span>
                <span className="text-lg font-semibold text-gray-900">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Interviews</span>
                <span className="text-lg font-semibold text-blue-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Meetings</span>
                <span className="text-lg font-semibold text-green-600">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Free Time</span>
                <span className="text-lg font-semibold text-gray-600">3h 30m</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowNewEventModal(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Interview</span>
              </button>
              
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>View Calendar</span>
              </button>
              
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedEvent.start_time).toLocaleDateString()} at {formatTime(selectedEvent.start_time)}
                  </p>
                  <p className="text-xs text-gray-500">Duration: {formatDuration(selectedEvent.duration)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>
              
              {/* Location */}
              {selectedEvent.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="flex items-center space-x-2">
                    {selectedEvent.location.type === 'video' ? <Video className="h-4 w-4 text-gray-500" /> :
                     selectedEvent.location.type === 'phone' ? <Phone className="h-4 w-4 text-gray-500" /> :
                     <MapPin className="h-4 w-4 text-gray-500" />}
                    <span className="text-sm text-gray-900">{selectedEvent.location.details}</span>
                  </div>
                  {selectedEvent.location.meeting_link && (
                    <a
                      href={selectedEvent.location.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Join Meeting</span>
                    </a>
                  )}
                </div>
              )}
              
              {/* Participants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
                <div className="space-y-2">
                  {selectedEvent.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                        <p className="text-xs text-gray-500">{participant.email} • {participant.role}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        participant.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        participant.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        participant.status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900">{selectedEvent.description}</p>
                </div>
              )}
              
              {/* Agenda */}
              {selectedEvent.agenda && selectedEvent.agenda.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agenda</label>
                  <ul className="space-y-1">
                    {selectedEvent.agenda.map((item, index) => (
                      <li key={index} className="text-sm text-gray-900 flex items-start space-x-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit Event</span>
                </button>
                
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                  <Copy className="h-4 w-4" />
                  <span>Duplicate</span>
                </button>
                
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </button>
                
                <button
                  onClick={() => handleEventDelete(selectedEvent.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployerSchedule;