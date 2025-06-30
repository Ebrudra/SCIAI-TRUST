import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Star, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  MessageSquare,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  overview: {
    totalAnalyses: number;
    totalUsers: number;
    averageConfidence: number;
    ethicsFlags: number;
    trends: {
      analyses: number;
      users: number;
      confidence: number;
      flags: number;
    };
  };
  timeSeriesData: Array<{
    date: string;
    analyses: number;
    users: number;
    confidence: number;
    ethicsFlags: number;
  }>;
  providerStats: Array<{
    provider: string;
    count: number;
    avgConfidence: number;
    avgTime: number;
  }>;
  ethicsBreakdown: Array<{
    type: string;
    count: number;
    severity: { high: number; medium: number; low: number };
  }>;
  userEngagement: Array<{
    metric: string;
    value: number;
    change: number;
  }>;
}

const AdvancedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedChart, setSelectedChart] = useState<'analyses' | 'users' | 'confidence' | 'ethics'>('analyses');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock analytics data - in production, this would come from your API
      const mockData: AnalyticsData = {
        overview: {
          totalAnalyses: 1247,
          totalUsers: 89,
          averageConfidence: 0.847,
          ethicsFlags: 23,
          trends: {
            analyses: 12.5,
            users: 8.3,
            confidence: -2.1,
            flags: -15.2
          }
        },
        timeSeriesData: generateTimeSeriesData(timeRange),
        providerStats: [
          { provider: 'OpenAI GPT-4', count: 756, avgConfidence: 0.89, avgTime: 45 },
          { provider: 'Google Gemini', count: 491, avgConfidence: 0.82, avgTime: 38 }
        ],
        ethicsBreakdown: [
          { type: 'Bias', count: 12, severity: { high: 2, medium: 6, low: 4 } },
          { type: 'Data Quality', count: 8, severity: { high: 1, medium: 3, low: 4 } },
          { type: 'Methodology', count: 3, severity: { high: 0, medium: 2, low: 1 } }
        ],
        userEngagement: [
          { metric: 'Avg. Session Duration', value: 24.5, change: 8.2 },
          { metric: 'Analyses per User', value: 14.2, change: 15.7 },
          { metric: 'Return Rate', value: 68.4, change: -3.1 },
          { metric: 'Feedback Rate', value: 42.8, change: 12.4 }
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        analyses: Math.floor(Math.random() * 50) + 10,
        users: Math.floor(Math.random() * 20) + 5,
        confidence: Math.random() * 0.3 + 0.7,
        ethicsFlags: Math.floor(Math.random() * 5)
      });
    }
    
    return data;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const SimpleChart: React.FC<{ data: any[]; type: string }> = ({ data, type }) => {
    const maxValue = Math.max(...data.map(d => d[type]));
    
    return (
      <div className="flex items-end space-x-1 h-32">
        {data.slice(-20).map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-500 rounded-t"
              style={{ 
                height: `${(item[type] / maxValue) * 100}%`,
                minHeight: '2px'
              }}
            />
            {index % 5 === 0 && (
              <span className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600">You need admin privileges to view analytics.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
              <p className="text-sm text-gray-600">Comprehensive platform insights and metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={loadAnalyticsData}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : analyticsData && (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalAnalyses.toLocaleString()}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(analyticsData.overview.trends.analyses)}
                  <span className={`ml-1 ${getTrendColor(analyticsData.overview.trends.analyses)}`}>
                    {Math.abs(analyticsData.overview.trends.analyses)}% from last period
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(analyticsData.overview.trends.users)}
                  <span className={`ml-1 ${getTrendColor(analyticsData.overview.trends.users)}`}>
                    {Math.abs(analyticsData.overview.trends.users)}% from last period
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Confidence</p>
                    <p className="text-3xl font-bold text-gray-900">{Math.round(analyticsData.overview.averageConfidence * 100)}%</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(analyticsData.overview.trends.confidence)}
                  <span className={`ml-1 ${getTrendColor(analyticsData.overview.trends.confidence)}`}>
                    {Math.abs(analyticsData.overview.trends.confidence)}% from last period
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ethics Flags</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.ethicsFlags}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  {getTrendIcon(analyticsData.overview.trends.flags)}
                  <span className={`ml-1 ${getTrendColor(analyticsData.overview.trends.flags)}`}>
                    {Math.abs(analyticsData.overview.trends.flags)}% from last period
                  </span>
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Trends Over Time</h3>
                  <div className="flex space-x-2">
                    {[
                      { id: 'analyses', label: 'Analyses', color: 'blue' },
                      { id: 'users', label: 'Users', color: 'green' },
                      { id: 'confidence', label: 'Confidence', color: 'yellow' },
                      { id: 'ethics', label: 'Ethics Flags', color: 'red' }
                    ].map((chart) => (
                      <button
                        key={chart.id}
                        onClick={() => setSelectedChart(chart.id as any)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          selectedChart === chart.id
                            ? `bg-${chart.color}-100 text-${chart.color}-700`
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {chart.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <SimpleChart 
                  data={analyticsData.timeSeriesData} 
                  type={selectedChart === 'ethics' ? 'ethicsFlags' : selectedChart} 
                />
              </div>
            </div>

            {/* Provider Performance & Ethics Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">AI Provider Performance</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analyticsData.providerStats.map((provider, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{provider.provider}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{provider.count} analyses</span>
                            <span>•</span>
                            <span>{Math.round(provider.avgConfidence * 100)}% avg confidence</span>
                            <span>•</span>
                            <span>{provider.avgTime}s avg time</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(provider.count / Math.max(...analyticsData.providerStats.map(p => p.count))) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Ethics Flags Breakdown</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analyticsData.ethicsBreakdown.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{item.type}</h4>
                          <span className="text-sm text-gray-600">{item.count} total</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>High</span>
                              <span>{item.severity.high}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full" 
                                style={{ width: `${(item.severity.high / item.count) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Medium</span>
                              <span>{item.severity.medium}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${(item.severity.medium / item.count) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Low</span>
                              <span>{item.severity.low}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(item.severity.low / item.count) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Engagement Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">User Engagement Metrics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {analyticsData.userEngagement.map((metric, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {metric.metric.includes('Rate') || metric.metric.includes('Duration') 
                          ? `${metric.value}${metric.metric.includes('Rate') ? '%' : 'min'}`
                          : metric.value.toFixed(1)
                        }
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{metric.metric}</div>
                      <div className="flex items-center justify-center text-sm">
                        {getTrendIcon(metric.change)}
                        <span className={`ml-1 ${getTrendColor(metric.change)}`}>
                          {Math.abs(metric.change)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;