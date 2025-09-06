import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Archive, 
  Star, 
  Trash2, 
  Filter, 
  Plus, 
  User, 
  Circle, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Users, 
  Calendar, 
  FileText, 
  Image, 
  Download,
  Reply,
  Forward,
  Flag,
  Bookmark,
  Settings,
  Bell,
  BellOff,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Share,
  Edit,
  Copy,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  read: boolean;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  reply_to?: string;
  edited?: boolean;
  reactions?: {
    emoji: string;
    users: string[];
  }[];
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar?: string;
  participant_title: string;
  participant_company?: string;
  last_message: Message;
  unread_count: number;
  pinned: boolean;
  archived: boolean;
  muted: boolean;
  starred: boolean;
  status: 'online' | 'offline' | 'away' | 'busy';
  last_seen?: string;
  conversation_type: 'candidate' | 'recruiter' | 'team' | 'group';
  job_context?: {
    job_id: string;
    job_title: string;
  };
  tags: string[];
  created_at: string;
}

const EmployerMessages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participant_id: 'candidate_1',
      participant_name: 'Sarah Johnson',
      participant_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      participant_title: 'Senior Frontend Developer',
      participant_company: 'Freelancer',
      last_message: {
        id: 'msg_1',
        sender_id: 'candidate_1',
        sender_name: 'Sarah Johnson',
        content: 'Thank you for considering my application. I\'m very excited about this opportunity!',
        timestamp: '2024-01-20T10:30:00Z',
        type: 'text',
        read: false
      },
      unread_count: 2,
      pinned: true,
      archived: false,
      muted: false,
      starred: true,
      status: 'online',
      conversation_type: 'candidate',
      job_context: {
        job_id: 'job_1',
        job_title: 'Senior React Developer'
      },
      tags: ['high-priority', 'frontend'],
      created_at: '2024-01-15T09:00:00Z'
    },
    {
      id: '2',
      participant_id: 'candidate_2',
      participant_name: 'Michael Chen',
      participant_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      participant_title: 'Full Stack Developer',
      participant_company: 'Tech Corp',
      last_message: {
        id: 'msg_2',
        sender_id: 'employer_1',
        sender_name: 'TechCorp Solutions',
        content: 'We\'d like to schedule a technical interview with you.',
        timestamp: '2024-01-19T16:45:00Z',
        type: 'text',
        read: true
      },
      unread_count: 0,
      pinned: false,
      archived: false,
      muted: false,
      starred: false,
      status: 'away',
      last_seen: '2024-01-19T18:00:00Z',
      conversation_type: 'candidate',
      job_context: {
        job_id: 'job_2',
        job_title: 'Full Stack Engineer'
      },
      tags: ['interview', 'backend'],
      created_at: '2024-01-10T14:30:00Z'
    },
    {
      id: '3',
      participant_id: 'candidate_3',
      participant_name: 'Emily Rodriguez',
      participant_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      participant_title: 'UX/UI Designer',
      participant_company: 'Design Studio',
      last_message: {
        id: 'msg_3',
        sender_id: 'candidate_3',
        sender_name: 'Emily Rodriguez',
        content: 'I\'ve attached my portfolio for your review.',
        timestamp: '2024-01-18T14:20:00Z',
        type: 'file',
        read: true,
        attachments: [{
          id: 'att_1',
          name: 'Emily_Rodriguez_Portfolio.pdf',
          url: '/files/portfolio.pdf',
          type: 'application/pdf',
          size: 2048000
        }]
      },
      unread_count: 0,
      pinned: false,
      archived: false,
      muted: false,
      starred: false,
      status: 'offline',
      last_seen: '2024-01-18T15:00:00Z',
      conversation_type: 'candidate',
      job_context: {
        job_id: 'job_3',
        job_title: 'UX/UI Designer'
      },
      tags: ['design', 'portfolio'],
      created_at: '2024-01-05T11:15:00Z'
    }
  ];

  const mockMessages: { [key: string]: Message[] } = {
    '1': [
      {
        id: 'msg_1_1',
        sender_id: 'employer_1',
        sender_name: 'TechCorp Solutions',
        content: 'Hi Sarah, thank you for your application for the Senior React Developer position.',
        timestamp: '2024-01-15T09:00:00Z',
        type: 'text',
        read: true
      },
      {
        id: 'msg_1_2',
        sender_id: 'candidate_1',
        sender_name: 'Sarah Johnson',
        content: 'Thank you for reaching out! I\'m very interested in this position.',
        timestamp: '2024-01-15T09:15:00Z',
        type: 'text',
        read: true
      },
      {
        id: 'msg_1_3',
        sender_id: 'employer_1',
        sender_name: 'TechCorp Solutions',
        content: 'Great! Could you tell me more about your experience with React and TypeScript?',
        timestamp: '2024-01-15T09:30:00Z',
        type: 'text',
        read: true
      },
      {
        id: 'msg_1_4',
        sender_id: 'candidate_1',
        sender_name: 'Sarah Johnson',
        content: 'I have 5+ years of experience with React and 3 years with TypeScript. I\'ve built several large-scale applications using these technologies.',
        timestamp: '2024-01-15T10:00:00Z',
        type: 'text',
        read: true
      },
      {
        id: 'msg_1_5',
        sender_id: 'candidate_1',
        sender_name: 'Sarah Johnson',
        content: 'Thank you for considering my application. I\'m very excited about this opportunity!',
        timestamp: '2024-01-20T10:30:00Z',
        type: 'text',
        read: false
      }
    ]
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(mockMessages[selectedConversation.id] || []);
      // Mark messages as read
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markConversationAsRead = (conversationId: string) => {
    setConversations(conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unread_count: 0, last_message: { ...conv.last_message, read: true } }
        : conv
    ));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      sender_id: user?.id || 'employer_1',
      sender_name: user?.name || 'TechCorp Solutions',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      read: true,
      reply_to: replyingTo?.id
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setReplyingTo(null);
    
    // Update conversation last message
    setConversations(conversations.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, last_message: message }
        : conv
    ));

    toast.success('Message sent');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.last_message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && conv.unread_count > 0) ||
                         (filterType === 'starred' && conv.starred) ||
                         (filterType === 'pinned' && conv.pinned) ||
                         (filterType === 'archived' && conv.archived);
    
    return matchesSearch && matchesFilter;
  });

  const toggleConversationAction = (conversationId: string, action: string) => {
    setConversations(conversations.map(conv => {
      if (conv.id === conversationId) {
        switch (action) {
          case 'pin':
            return { ...conv, pinned: !conv.pinned };
          case 'star':
            return { ...conv, starred: !conv.starred };
          case 'mute':
            return { ...conv, muted: !conv.muted };
          case 'archive':
            return { ...conv, archived: !conv.archived };
          default:
            return conv;
        }
      }
      return conv;
    }));
    
    toast.success(`Conversation ${action}d`);
  };

  const handleFileUpload = (type: 'file' | 'image') => {
    if (type === 'file') {
      fileInputRef.current?.click();
    } else {
      imageInputRef.current?.click();
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      sender_id: user?.id || 'employer_1',
      sender_name: user?.name || 'TechCorp Solutions',
      content: `Shared a ${type}`,
      timestamp: new Date().toISOString(),
      type: type,
      read: true,
      attachments: [{
        id: `att_${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size
      }]
    };

    setMessages([...messages, message]);
    setConversations(conversations.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, last_message: message }
        : conv
    ));

    toast.success(`${type} uploaded successfully`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="New Message"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filters */}
          <div className="flex space-x-1 mt-3">
            {['all', 'unread', 'starred', 'pinned'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-3 py-1 text-xs rounded-full capitalize ${
                  filterType === filter 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-r-blue-600' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative flex-shrink-0">
                    {conversation.participant_avatar ? (
                      <img
                        src={conversation.participant_avatar}
                        alt={conversation.participant_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.participant_name}
                        </h3>
                        {conversation.pinned && <Pin className="h-3 w-3 text-blue-600" />}
                        {conversation.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        {conversation.muted && <BellOff className="h-3 w-3 text-gray-400" />}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message.timestamp)}
                        </span>
                        {conversation.unread_count > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-1">{conversation.participant_title}</p>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        conversation.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        {conversation.last_message.type === 'file' ? '📎 File attachment' : 
                         conversation.last_message.type === 'image' ? '🖼️ Image' :
                         conversation.last_message.content}
                      </p>
                      
                      {conversation.last_message.read && conversation.last_message.sender_id === (user?.id || 'employer_1') && (
                        <CheckCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    
                    {conversation.job_context && (
                      <div className="mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {conversation.job_context.job_title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {selectedConversation.participant_avatar ? (
                      <img
                        src={selectedConversation.participant_avatar}
                        alt={selectedConversation.participant_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(selectedConversation.status)}`}></div>
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.participant_name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.status === 'online' ? 'Online' : 
                       selectedConversation.last_seen ? `Last seen ${formatTime(selectedConversation.last_seen)}` : 
                       'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Video className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowConversationInfo(!showConversationInfo)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                  
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => toggleConversationAction(selectedConversation.id, 'pin')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        {selectedConversation.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        <span>{selectedConversation.pinned ? 'Unpin' : 'Pin'} Conversation</span>
                      </button>
                      <button
                        onClick={() => toggleConversationAction(selectedConversation.id, 'star')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Star className={`h-4 w-4 ${selectedConversation.starred ? 'fill-current text-yellow-500' : ''}`} />
                        <span>{selectedConversation.starred ? 'Unstar' : 'Star'} Conversation</span>
                      </button>
                      <button
                        onClick={() => toggleConversationAction(selectedConversation.id, 'mute')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        {selectedConversation.muted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        <span>{selectedConversation.muted ? 'Unmute' : 'Mute'} Notifications</span>
                      </button>
                      <button
                        onClick={() => toggleConversationAction(selectedConversation.id, 'archive')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Archive className="h-4 w-4" />
                        <span>Archive Conversation</span>
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Conversation</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === (user?.id || 'employer_1');
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isOwnMessage && (
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            selectedConversation.participant_avatar ? (
                              <img
                                src={selectedConversation.participant_avatar}
                                alt={message.sender_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                            )
                          ) : (
                            <div className="w-8 h-8"></div>
                          )}
                        </div>
                      )}
                      
                      <div className={`relative group ${
                        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'
                      } rounded-lg p-3 shadow-sm`}>
                        {message.reply_to && (
                          <div className="mb-2 p-2 bg-gray-100 rounded text-xs text-gray-600 border-l-2 border-gray-300">
                            Replying to previous message
                          </div>
                        )}
                        
                        {message.type === 'text' && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        {message.type === 'file' && message.attachments && (
                          <div className="space-y-2">
                            <p className="text-sm">{message.content}</p>
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-gray-900">{attachment.name}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                </div>
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {message.type === 'image' && message.attachments && (
                          <div className="space-y-2">
                            <p className="text-sm">{message.content}</p>
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id}>
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-full h-auto rounded"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                            {message.edited && ' (edited)'}
                          </span>
                          
                          {isOwnMessage && (
                            <div className="flex items-center space-x-1">
                              {message.read ? (
                                <CheckCircle className="h-3 w-3 text-blue-200" />
                              ) : (
                                <Circle className="h-3 w-3 text-blue-200" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Message Actions */}
                        <div className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} top-0 transform ${isOwnMessage ? '-translate-x-full' : 'translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="Reply"
                            >
                              <Reply className="h-3 w-3" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-600 rounded" title="React">
                              <Smile className="h-3 w-3" />
                            </button>
                            {isOwnMessage && (
                              <>
                                <button
                                  onClick={() => setEditingMessage(message)}
                                  className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                                  title="Edit"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-red-600 rounded" title="Delete">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Reply Banner */}
            {replyingTo && (
              <div className="bg-blue-50 border-t border-blue-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Reply className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Replying to {replyingTo.sender_name}</span>
                    <span className="text-sm text-blue-600 truncate max-w-xs">{replyingTo.content}</span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
                <div className="relative">
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <button
                        onClick={() => handleFileUpload('file')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Upload File</span>
                      </button>
                      <button
                        onClick={() => handleFileUpload('image')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Image className="h-4 w-4" />
                        <span>Upload Image</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
                </button>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500 mb-6">Choose a conversation from the sidebar to start messaging</p>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Start New Conversation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Info Sidebar */}
      {showConversationInfo && selectedConversation && (
        <motion.div 
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="w-80 bg-white border-l border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Conversation Info</h3>
            <button
              onClick={() => setShowConversationInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Participant Info */}
            <div className="text-center">
              {selectedConversation.participant_avatar ? (
                <img
                  src={selectedConversation.participant_avatar}
                  alt={selectedConversation.participant_name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
              )}
              <h4 className="text-lg font-semibold text-gray-900">{selectedConversation.participant_name}</h4>
              <p className="text-gray-600">{selectedConversation.participant_title}</p>
              {selectedConversation.participant_company && (
                <p className="text-sm text-gray-500">{selectedConversation.participant_company}</p>
              )}
            </div>
            
            {/* Job Context */}
            {selectedConversation.job_context && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Related Job</h5>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{selectedConversation.job_context.job_title}</p>
                  <p className="text-xs text-gray-500">Job ID: {selectedConversation.job_context.job_id}</p>
                </div>
              </div>
            )}
            
            {/* Tags */}
            {selectedConversation.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedConversation.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Schedule Meeting</span>
              </button>
              
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                <User className="h-4 w-4" />
                <span>View Profile</span>
              </button>
              
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                <Share className="h-4 w-4" />
                <span>Share Contact</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => onFileSelect(e, 'file')}
        accept=".pdf,.doc,.docx,.txt,.zip"
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={(e) => onFileSelect(e, 'image')}
        accept="image/*"
      />
    </div>
  );
};

export default EmployerMessages;