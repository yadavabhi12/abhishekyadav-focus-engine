import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/users';
import { taskService } from '../services/tasks';
import { focusService } from '../services/focus';
import { toast } from 'react-hot-toast';
import {
  Edit3, X, Camera, ExternalLink, Briefcase, GraduationCap,
  MapPin, Globe, Target, TrendingUp, Award, Zap,
  MessageCircle, ThumbsUp, Eye, User, Mail, Clock,
  BarChart3, Tag, Settings, CheckCircle, Star,
  CheckSquare, Square, Calendar, PieChart, Loader,
  Trophy, TrendingUp as TrendingUpIcon, BarChart2, Plus
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CategoryStats from '../components/profile/CategoryStats';
import FocusStats from '../components/profile/FocusStats';
import AchievementCard from '../components/profile/AchievementCard';
import SettingsPanel from '../components/profile/SettingsPanel';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryStats, setCategoryStats] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [taskStats, setTaskStats] = useState({ completed: 0, total: 0, pending: 0 });
  const [focusStats, setFocusStats] = useState({
    totalFocusMinutes: 0,
    completedSessions: 0,
    distractions: 0
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' });

  // Avatar handling
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarObjectRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);

  // Cover handling
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const coverObjectRef = useRef(null);
  const [coverError, setCoverError] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    company: '',
    position: '',
    education: ''
  });

  // Build image URL
  const buildImageUrl = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url;

    let apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim();
    apiBase = apiBase.replace(/\/+$/, '');

    if (url.startsWith('/api/')) return `${apiBase}${url}`;

    const originOnly = apiBase.replace(/\/api\/.*$/i, '');
    if (url.startsWith('/uploads')) return `${originOnly}${url}`;
    return `${originOnly}/${url.replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    if (!user) return;

    // Prefill form
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      company: user.company || '',
      position: user.position || '',
      education: user.education || ''
    });

    // Set previews from user data
    if (user.photoUrl) {
      setAvatarPreview(buildImageUrl(user.photoUrl));
      setAvatarError(false);
    } else {
      setAvatarPreview('');
    }

    if (user.coverUrl) {
      setCoverPreview(buildImageUrl(user.coverUrl));
      setCoverError(false);
    } else {
      setCoverPreview('');
    }

    // Fetch additional data
    fetchTaskStats();
    fetchCategoryStats();
    fetchAchievements();
    fetchFocusStats();

    // Cleanup
    return () => {
      if (avatarObjectRef.current) {
        URL.revokeObjectURL(avatarObjectRef.current);
        avatarObjectRef.current = null;
      }
      if (coverObjectRef.current) {
        URL.revokeObjectURL(coverObjectRef.current);
        coverObjectRef.current = null;
      }
    };
  }, [user]);

  const fetchTaskStats = async () => {
    try {
      const response = await taskService.getTasks();
      const tasks = response.tasks || [];
      
      const completed = tasks.filter(task => task.completed).length;
      const total = tasks.length;
      const pending = total - completed;
      
      setTaskStats({ completed, total, pending });
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const response = await userService.getCategoryStats();
      setCategoryStats(response.categoryStats || []);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      // Fallback to calculating from tasks if API fails
      try {
        const response = await taskService.getTasks();
        const tasks = response.tasks || [];
        
        // Group tasks by category and calculate stats
        const categoryMap = {};
        
        tasks.forEach(task => {
          if (task.category) {
            const categoryName = task.category.name || 'Uncategorized';
            const categoryColor = task.category.color || '#6b7280';
            
            if (!categoryMap[categoryName]) {
              categoryMap[categoryName] = {
                category: categoryName,
                tasks: 0,
                completed: 0,
                hours: 0,
                color: categoryColor
              };
            }
            
            categoryMap[categoryName].tasks += 1;
            if (task.completed) {
              categoryMap[categoryName].completed += 1;
            }
            
            // Calculate actual hours from focus sessions
            if (task.focusSessions && task.focusSessions.length > 0) {
              const taskHours = task.focusSessions.reduce((total, session) => 
                total + (session.duration || 0), 0) / 60;
              categoryMap[categoryName].hours += taskHours;
            }
          }
        });
        
        // Convert to array and sort by task count
        const stats = Object.values(categoryMap).sort((a, b) => b.tasks - a.tasks);
        setCategoryStats(stats);
      } catch (fallbackError) {
        console.error('Fallback category stats error:', fallbackError);
      }
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await userService.getAchievements();
      setAchievements(response.achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Set default achievements if API fails
      setAchievements([
        {
          name: 'Daily Focus',
          description: 'Complete 2 hours of focused work today',
          progress: 0,
          completed: false,
          icon: '⏰',
          points: 10
        },
        {
          name: 'Focus Sessions',
          description: 'Complete 4 focus sessions today',
          progress: 0,
          completed: false,
          icon: '🎯',
          points: 15
        },
        {
          name: 'Weekly Goal',
          description: 'Reach your weekly goal of 20 hours',
          progress: 0,
          completed: false,
          icon: '🏆',
          points: 25
        }
      ]);
    }
  };

  const fetchFocusStats = async () => {
    try {
      const response = await focusService.getTodayStats();
      setFocusStats(response.stats || {
        totalFocusMinutes: 0,
        completedSessions: 0,
        distractions: 0
      });
    } catch (error) {
      console.error('Error fetching focus stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Select a valid image (JPEG, PNG, GIF, WEBP).');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    if (avatarObjectRef.current) {
      URL.revokeObjectURL(avatarObjectRef.current);
    }
    
    const objUrl = URL.createObjectURL(file);
    avatarObjectRef.current = objUrl;
    setAvatarFile(file);
    setAvatarPreview(objUrl);
    setAvatarError(false);
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Select a valid image (JPEG, PNG, WEBP).');
      return;
    }
    
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Cover image must be under 8MB');
      return;
    }

    if (coverObjectRef.current) {
      URL.revokeObjectURL(coverObjectRef.current);
    }
    
    const objUrl = URL.createObjectURL(file);
    coverObjectRef.current = objUrl;
    setCoverFile(file);
    setCoverPreview(objUrl);
    setCoverError(false);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      toast.error('Please choose an avatar to upload');
      return;
    }
    
    setUploading(true);
    try {
      const response = await userService.uploadPhoto(avatarFile);
      if (response.user) {
        updateUser(response.user);
        toast.success('Avatar uploaded successfully');
        setAvatarFile(null);
        
        // Update preview with new URL
        if (response.user.photoUrl) {
          setAvatarPreview(buildImageUrl(response.user.photoUrl));
        }
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const uploadCover = async () => {
    if (!coverFile) {
      toast.error('Please choose a cover image to upload');
      return;
    }
    
    setUploading(true);
    try {
      const response = await userService.uploadCover(coverFile);
      if (response.user) {
        updateUser(response.user);
        toast.success('Cover uploaded successfully');
        setCoverFile(null);
        
        // Update preview with new URL
        if (response.user.coverUrl) {
          setCoverPreview(buildImageUrl(response.user.coverUrl));
        }
      }
    } catch (error) {
      console.error('Cover upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload cover');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
      const response = await userService.updateProfile(formData);
      if (response.user) {
        updateUser(response.user);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      company: user.company || '',
      position: user.position || '',
      education: user.education || ''
    });
    
    if (user.photoUrl) setAvatarPreview(buildImageUrl(user.photoUrl));
    else setAvatarPreview('');
    
    if (user.coverUrl) setCoverPreview(buildImageUrl(user.coverUrl));
    else setCoverPreview('');
    
    if (avatarObjectRef.current) {
      URL.revokeObjectURL(avatarObjectRef.current);
      avatarObjectRef.current = null;
    }
    
    if (coverObjectRef.current) {
      URL.revokeObjectURL(coverObjectRef.current);
      coverObjectRef.current = null;
    }
    
    setAvatarFile(null);
    setCoverFile(null);
    setIsEditing(false);
  };

  const handleWebsiteClick = (e) => {
    e.preventDefault();
    if (!formData.website) return;
    
    let url = formData.website;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    window.open(url, '_blank', 'noopener');
  };

  const formatWebsite = (url) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  };

  const formatHoursMinutes = (totalMinutes) => {
    if (!totalMinutes || isNaN(totalMinutes)) return '0h 0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      // This would call your API to add a new category
      // For now, we'll just update the UI
      const updatedStats = [...categoryStats, {
        category: newCategory.name,
        color: newCategory.color,
        tasks: 0,
        completed: 0,
        hours: 0
      }];
      
      setCategoryStats(updatedStats);
      setShowAddCategory(false);
      setNewCategory({ name: '', color: '#3B82F6' });
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const displayAvatar = avatarPreview || (user.photoUrl ? buildImageUrl(user.photoUrl) : '');
  const displayCover = coverPreview || (user.coverUrl ? buildImageUrl(user.coverUrl) : '');
  const initials = (user.name || 'U').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Cover Photo */}
      <div className="relative rounded-lg overflow-hidden shadow-sm mb-6">
        <div
          className="h-48 md:h-56 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center relative"
          style={{
            backgroundImage: displayCover ? `url(${displayCover})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!displayCover && (
            <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300" />
          )}

          {isEditing && (
            <label className="absolute top-3 right-3 bg-white/90 rounded-full p-2 shadow cursor-pointer border z-10">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
            </label>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Loader className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="px-4 sm:px-6">
          <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="relative">
                <div className="rounded-full p-1 bg-white">
                  <div className="rounded-full p-1 bg-gradient-to-tr from-sky-400 to-indigo-500">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-gray-100 shadow-xl">
                      {displayAvatar && !avatarError ? (
                        <img
                          src={displayAvatar}
                          alt={`${user.name} avatar`}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600">
                          <span className="text-white text-xl sm:text-2xl md:text-3xl font-semibold">{initials}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow border cursor-pointer">
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-slate-700" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                  </label>
                )}
              </div>

              {/* Name and Info */}
              <div className="mt-3 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">{user.name}</h1>
                <div className="text-xs sm:text-sm text-slate-600 mt-1">{user.position || 'No position set'}</div>
                <div className="text-xs text-slate-500 mt-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                  {user.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      {user.location}
                    </span>
                  )}
                  {user.website && (
                    <a 
                      className="inline-flex items-center gap-1 underline" 
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                      onClick={handleWebsiteClick}
                    >
                      <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                      {formatWebsite(user.website)}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              {!isEditing ? (
                <>
                  <Button variant="primary" className="flex items-center gap-2 text-xs sm:text-sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" /> Edit
                  </Button>
                  <Button variant="outline" className="text-xs sm:text-sm" onClick={() => setActiveTab('settings')}>
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" /> Settings
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" onClick={handleSaveProfile} loading={loading} disabled={loading} className="text-xs sm:text-sm">
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEdit} className="text-xs sm:text-sm">
                    <X className="h-3 w-3 sm:h-4 sm:w-4" /> Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          className={`px-3 py-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-3 py-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'stats' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`px-3 py-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'achievements' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
        <button
          className={`px-3 py-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                      <Input
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                      <Input
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                      <Input
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Education</label>
                    <Input
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">{user.bio || "No bio added yet."}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {user.company && (
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="dark:text-gray-300">{user.company}</span>
                      </div>
                    )}
                    {user.position && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="dark:text-gray-300">{user.position}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="dark:text-gray-300">{user.location}</span>
                      </div>
                    )}
                    {user.education && (
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="dark:text-gray-300">{user.education}</span>
                      </div>
                    )}
                    {user.website && (
                      <div className="flex items-center col-span-1 sm:col-span-2">
                        <Globe className="h-4 w-4 text-gray-500 mr-2" />
                        <a 
                          href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                          onClick={handleWebsiteClick}
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {formatWebsite(user.website)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium dark:text-gray-300">Completed {taskStats.completed} tasks today</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium dark:text-gray-300">Focused for {formatHoursMinutes(focusStats.totalFocusMinutes || 0)} this week</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">This week</div>
                  </div>
                </div>
                {achievements.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-purple-50 dark:bg-purple-900/20 p-2">
                      <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium dark:text-gray-300">Earned {achievements.length} achievements</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Stats Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm dark:text-gray-300">Tasks Completed</span>
                  </div>
                  <span className="font-semibold dark:text-gray-300">{taskStats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Square className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm dark:text-gray-300">Tasks Pending</span>
                  </div>
                  <span className="font-semibold dark:text-gray-300">{taskStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm dark:text-gray-300">Focus Hours</span>
                  </div>
                  <span className="font-semibold dark:text-gray-300">{formatHoursMinutes(focusStats.totalFocusMinutes || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm dark:text-gray-300">Current Streak</span>
                  </div>
                  <span className="font-semibold dark:text-gray-300">{user.stats?.streak || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm dark:text-gray-300">Productivity Score</span>
                  </div>
                  <span className="font-semibold dark:text-gray-300">{user.stats?.productivityScore || 0}%</span>
                </div>
              </div>
            </div>

            {/* Weekly Goal Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Weekly Goal</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm dark:text-gray-300">
                  <span>Focus Hours</span>
                  <span>{formatHoursMinutes(focusStats.totalFocusMinutes || 0)} / {user.stats?.weeklyGoal || 20}h</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(((focusStats.totalFocusMinutes || 0) / 60 / (user.stats?.weeklyGoal || 20)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {(user.stats?.weeklyGoal || 20) - ((focusStats.totalFocusMinutes || 0) / 60) > 0 
                    ? `${((user.stats?.weeklyGoal || 20) - (focusStats.totalFocusMinutes || 0) / 60).toFixed(1)} hours left to reach your goal` 
                    : 'Goal completed! Great job!'}
                </p>
              </div>
            </div>

            {/* Upload Controls (when editing) */}
            {isEditing && (avatarFile || coverFile) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow">
                <h2 className="text-lg font-semibold mb-4">Upload Media</h2>
                <div className="space-y-3">
                  {avatarFile && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium dark:text-gray-300">Avatar Image</span>
                      <div className="flex gap-2">
                        <Button onClick={uploadAvatar} loading={uploading} disabled={uploading} size="sm">
                          Upload Avatar
                        </Button>
                        <Button variant="secondary" onClick={() => setAvatarFile(null)} size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {coverFile && (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium dark:text-gray-300">Cover Image</span>
                      <div className="flex gap-2">
                        <Button onClick={uploadCover} loading={uploading} disabled={uploading} size="sm">
                          Upload Cover
                        </Button>
                        <Button variant="secondary" onClick={() => setCoverFile(null)} size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4 sm:space-y-6">
          <FocusStats user={user} focusStats={focusStats} />
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Work by Category
              </h2>
              <Button variant="primary" size="sm" onClick={() => setShowAddCategory(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Category
              </Button>
            </div>
            <CategoryStats stats={categoryStats} />
          </div>
        </div>
      )}

{activeTab === 'achievements' && (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow">
      <h2 className="text-lg font-semibold mb-4">Your Achievements</h2>
      {achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <AchievementCard key={achievement._id || index} achievement={achievement} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Award className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p>No achievements yet. Keep completing tasks to earn achievements!</p>
        </div>
      )}
    </div>
  </div>
)}

      {activeTab === 'settings' && (
        <SettingsPanel user={user} />
      )}

      {/* Add Category Modal */}
      <Modal isOpen={showAddCategory} onClose={() => setShowAddCategory(false)} title="Add New Category">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
            <Input
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
            <Input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
              className="w-full h-10 p-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              Add Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;








