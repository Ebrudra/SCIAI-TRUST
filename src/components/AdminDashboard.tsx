import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Search,
  Eye,
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminService } from '../services/adminService';

interface DashboardStats {
  totalAnalyses: number;
  totalUsers: number;
  totalFeedback: number;
  averageRating: number;
  ethicsFlags: number;
  activeUsers: number;
  recentAnalyses: number;
  feedbackTrends: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface FeedbackItem {
  id: string;
  summaryId: string;
  paperTitle: string;
  rating: number;
  helpful: boolean;
  accuracy: number;
  comments?: string;
  submittedAt: Date;
  userId: string;
  userEmail: string;
}

interface EthicsAlert {
  id: string;
  summaryId: string;
  paperTitle: string;
  flagType: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'ethics' | 'users' | 'analytics'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [ethicsAlerts, setEthicsAlerts] = useState<EthicsAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardData();
    }
  }, [user, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, feedbackData, ethicsData] = await Promise.all([
        AdminService.getDashboardStats(dateRange),
        AdminService.getFeedback(),
        AdminService.getEthicsAlerts()
      ]);

      setStats(dashboardStats);
      setFeedback(feedbackData);
      setEthicsAlerts(ethicsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type: 'feedback' | 'ethics' | 'analytics') => {
    try {
      await AdminService.exportData(type, { dateRange, searchTerm });
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleResolveEthicsAlert = async (alertId: string) => {
    try {
      await AdminService.updateEthicsAlert(alertId, 'resolved');
      setEthicsAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
    } catch (error) {
      console.error('Error resolving ethics alert:', error);
    }
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'ethics', label: 'Ethics Alerts', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = !searchTerm || 
      item.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.comments?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = !filterRating || item.rating === filterRating;
    
    return matchesSearch && matchesRating;
  });

  const filteredEthicsAlerts = ethicsAlerts.filter(alert => {
    const matchesSearch = !searchTerm || 
      alert.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = !filterSeverity || alert.severity === filterSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage feedback, ethics alerts, and platform analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalAnalyses.toLocaleString()}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+{stats.recentAnalyses} this period</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-600">Total: {stats.totalUsers.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-600">{stats.totalFeedback} reviews</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ethics Flags</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.ethicsFlags}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-red-600">Requires attention</span>
                </div>
              </div>
            </div>

            {/* Feedback Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Sentiment</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Positive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(stats.feedbackTrends.positive / stats.totalFeedback) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{stats.feedbackTrends.positive}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Neutral</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(stats.feedbackTrends.neutral / stats.totalFeedback) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{stats.feedbackTrends.neutral}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Negative</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(stats.feedbackTrends.negative / stats.totalFeedback) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{stats.feedbackTrends.negative}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">15 new analyses completed</span>
                    <span className="text-gray-400">2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">8 feedback submissions received</span>
                    <span className="text-gray-400">4 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Flag className="h-4 w-4 text-red-500" />
                    <span className="text-gray-600">2 ethics flags raised</span>
                    <span className="text-gray-400">6 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-600">12 new user registrations</span>
                    <span className="text-gray-400">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search feedback..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <select
                    value={filterRating || ''}
                    onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                
                <button
                  onClick={() => handleExportData('feedback')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Feedback</span>
                </button>
              </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  User Feedback ({filteredFeedback.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredFeedback.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 truncate">{item.paperTitle}</h4>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span>{item.userEmail}</span>
                          <span>•</span>
                          <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.helpful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.helpful ? 'Helpful' : 'Not Helpful'}
                          </span>
                          <span>•</span>
                          <span>Accuracy: {item.accuracy}/5</span>
                        </div>
                        
                        {item.comments && (
                          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md">
                            "{item.comments}"
                          </p>
                        )}
                      </div>
                      
                      <button className="ml-4 p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredFeedback.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No feedback found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ethics Alerts Tab */}
        {activeTab === 'ethics' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search ethics alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <select
                    value={filterSeverity || ''}
                    onChange={(e) => setFilterSeverity(e.target.value || null)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <button
                  onClick={() => handleExportData('ethics')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Alerts</span>
                </button>
              </div>
            </div>

            {/* Ethics Alerts List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Ethics Alerts ({filteredEthicsAlerts.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredEthicsAlerts.map((alert) => (
                  <div key={alert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{alert.paperTitle}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            alert.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{alert.flagType}</span>
                          <span>•</span>
                          <span>{new Date(alert.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <p className="text-gray-700 text-sm">{alert.description}</p>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        {alert.status === 'pending' && (
                          <button
                            onClick={() => handleResolveEthicsAlert(alert.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Resolve
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredEthicsAlerts.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No ethics alerts found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600 mb-4">
              User management features will be implemented in the next phase.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Coming Soon
            </button>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-gray-600 mb-4">
              Detailed analytics and reporting features will be available soon.
            </p>
            <button 
              onClick={() => handleExportData('analytics')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Export Basic Analytics
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;