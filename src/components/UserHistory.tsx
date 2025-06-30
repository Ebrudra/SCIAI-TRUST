import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Star, 
  Eye, 
  Download, 
  Share2, 
  Filter, 
  Search,
  ChevronDown,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';
import { Paper, Summary } from '../types';

interface HistoryItem {
  id: string;
  type: 'paper' | 'summary';
  title: string;
  createdAt: Date;
  status: 'completed' | 'processing' | 'failed';
  confidence?: number;
  provider?: string;
  paper?: Paper;
  summary?: Summary;
}

const UserHistory: React.FC = () => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'papers' | 'summaries'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadUserHistory();
    }
  }, [user]);

  const loadUserHistory = async () => {
    try {
      setLoading(true);
      const [papers, summaries] = await Promise.all([
        ApiService.getUserPapers(),
        ApiService.getUserSummaries()
      ]);

      const items: HistoryItem[] = [
        ...papers.map(paper => ({
          id: paper.id,
          type: 'paper' as const,
          title: paper.title,
          createdAt: new Date(paper.metadata?.uploadedAt || Date.now()),
          status: 'completed' as const,
          paper
        })),
        ...summaries.map(summary => ({
          id: summary.id,
          type: 'summary' as const,
          title: `Analysis: ${summary.paperId}`,
          createdAt: summary.generatedAt,
          status: 'completed' as const,
          confidence: summary.confidence,
          provider: 'AI Analysis',
          summary
        }))
      ];

      setHistoryItems(items);
    } catch (error) {
      console.error('Error loading user history:', error);
      // Set empty array on error to prevent crashes
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedItems = historyItems
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || 
        (filterType === 'papers' && item.type === 'paper') ||
        (filterType === 'summaries' && item.type === 'summary');
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'confidence':
          comparison = (a.confidence || 0) - (b.confidence || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
      // TODO: Implement bulk delete API
      console.log('Bulk deleting items:', Array.from(selectedItems));
      setSelectedItems(new Set());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'processing':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>;
      case 'failed':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-300 rounded-full"></div>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'paper' ? 
      <FileText className="h-4 w-4 text-blue-600" /> : 
      <Star className="h-4 w-4 text-purple-600" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to view your analysis history.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
              <p className="text-sm text-gray-600">View and manage your research analyses</p>
            </div>
            <div className="flex items-center space-x-4">
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedItems.size})</span>
                </button>
              )}
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Download className="h-4 w-4" />
                <span>Export History</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="papers">Papers Only</option>
                <option value="summaries">Analyses Only</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="confidence">Confidence</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-3xl font-bold text-gray-900">{historyItems.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Papers Uploaded</p>
                <p className="text-3xl font-bold text-gray-900">
                  {historyItems.filter(item => item.type === 'paper').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Summaries</p>
                <p className="text-3xl font-bold text-gray-900">
                  {historyItems.filter(item => item.type === 'summary').length}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Confidence</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(historyItems
                    .filter(item => item.confidence)
                    .reduce((sum, item) => sum + (item.confidence || 0), 0) / 
                    historyItems.filter(item => item.confidence).length * 100) || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Activity ({filteredAndSortedItems.length})
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your history...</p>
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : 'Start by uploading a paper for analysis.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedItems.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                      {getTypeIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-4">
                          {item.confidence && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm text-gray-600">
                                {Math.round(item.confidence * 100)}%
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{item.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="capitalize">{item.type}</span>
                        {item.provider && (
                          <>
                            <span>•</span>
                            <span>{item.provider}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">{item.status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                        <Download className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHistory;