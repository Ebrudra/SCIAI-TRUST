import { supabase } from '../lib/supabase';

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

export class AdminService {
  static async getDashboardStats(dateRange: '7d' | '30d' | '90d' | 'all'): Promise<DashboardStats> {
    try {
      // Calculate date filter
      let dateFilter = '';
      if (dateRange !== 'all') {
        const days = parseInt(dateRange.replace('d', ''));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        dateFilter = cutoffDate.toISOString();
      }

      // Get total analyses
      let summariesQuery = supabase.from('summaries').select('id', { count: 'exact' });
      if (dateFilter) {
        summariesQuery = summariesQuery.gte('created_at', dateFilter);
      }
      const { count: totalAnalyses } = await summariesQuery;

      // Get recent analyses (for trend)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      const { count: recentAnalyses } = await supabase
        .from('summaries')
        .select('id', { count: 'exact' })
        .gte('created_at', recentDate.toISOString());

      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact' });

      // Get active users (users who created summaries in the date range)
      let activeUsersQuery = supabase
        .from('summaries')
        .select('metadata', { count: 'exact' });
      if (dateFilter) {
        activeUsersQuery = activeUsersQuery.gte('created_at', dateFilter);
      }
      const { count: activeUsers } = await activeUsersQuery;

      // Get feedback data
      let feedbackQuery = supabase.from('user_feedback').select('*');
      if (dateFilter) {
        feedbackQuery = feedbackQuery.gte('created_at', dateFilter);
      }
      const { data: feedbackData, count: totalFeedback } = await feedbackQuery;

      // Calculate average rating and sentiment
      let averageRating = 0;
      let positive = 0, negative = 0, neutral = 0;

      if (feedbackData && feedbackData.length > 0) {
        const totalRating = feedbackData.reduce((sum, item) => sum + item.rating, 0);
        averageRating = totalRating / feedbackData.length;

        feedbackData.forEach(item => {
          if (item.rating >= 4) positive++;
          else if (item.rating <= 2) negative++;
          else neutral++;
        });
      }

      // Get ethics flags
      let ethicsQuery = supabase
        .from('summaries')
        .select('ethics_flags');
      if (dateFilter) {
        ethicsQuery = ethicsQuery.gte('created_at', dateFilter);
      }
      const { data: summariesWithFlags } = await ethicsQuery;
      
      let ethicsFlags = 0;
      if (summariesWithFlags) {
        ethicsFlags = summariesWithFlags.reduce((total, summary) => {
          return total + (summary.ethics_flags?.length || 0);
        }, 0);
      }

      return {
        totalAnalyses: totalAnalyses || 0,
        totalUsers: totalUsers || 0,
        totalFeedback: totalFeedback || 0,
        averageRating,
        ethicsFlags,
        activeUsers: activeUsers || 0,
        recentAnalyses: recentAnalyses || 0,
        feedbackTrends: {
          positive,
          negative,
          neutral
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  static async getFeedback(): Promise<FeedbackItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select(`
          *,
          summaries (
            id,
            papers (title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        summaryId: item.summary_id,
        paperTitle: item.summaries?.papers?.title || 'Unknown Paper',
        rating: item.rating,
        helpful: item.helpful,
        accuracy: item.accuracy,
        comments: item.comments,
        submittedAt: new Date(item.created_at),
        userId: item.user_id || 'anonymous',
        userEmail: 'user@example.com' // TODO: Get from user table when available
      }));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw new Error('Failed to fetch feedback data');
    }
  }

  static async getEthicsAlerts(): Promise<EthicsAlert[]> {
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select(`
          id,
          ethics_flags,
          created_at,
          papers (title)
        `)
        .not('ethics_flags', 'eq', '[]')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const alerts: EthicsAlert[] = [];
      
      data.forEach(summary => {
        if (summary.ethics_flags && Array.isArray(summary.ethics_flags)) {
          summary.ethics_flags.forEach((flag: any, index: number) => {
            alerts.push({
              id: `${summary.id}-${index}`,
              summaryId: summary.id,
              paperTitle: summary.papers?.title || 'Unknown Paper',
              flagType: flag.type || 'unknown',
              severity: flag.severity || 'medium',
              description: flag.description || 'No description available',
              createdAt: new Date(summary.created_at),
              status: 'pending' // Default status
            });
          });
        }
      });

      return alerts;
    } catch (error) {
      console.error('Error fetching ethics alerts:', error);
      throw new Error('Failed to fetch ethics alerts');
    }
  }

  static async updateEthicsAlert(alertId: string, status: 'pending' | 'reviewed' | 'resolved'): Promise<void> {
    try {
      // For now, we'll just log the status change
      // In a real implementation, you'd update a separate ethics_alerts table
      console.log(`Ethics alert ${alertId} status updated to: ${status}`);
      
      // TODO: Implement actual status update in database
      // This would require a separate table to track alert statuses
    } catch (error) {
      console.error('Error updating ethics alert:', error);
      throw new Error('Failed to update ethics alert');
    }
  }

  static async exportData(
    type: 'feedback' | 'ethics' | 'analytics',
    options: { dateRange: string; searchTerm: string }
  ): Promise<void> {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'feedback':
          data = await this.getFeedback();
          filename = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'ethics':
          data = await this.getEthicsAlerts();
          filename = `ethics-alerts-export-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'analytics':
          const stats = await this.getDashboardStats(options.dateRange as any);
          data = [stats];
          filename = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
          break;
      }

      // Convert to CSV or JSON based on type
      let content = '';
      let mimeType = '';

      if (type === 'analytics') {
        content = JSON.stringify(data[0], null, 2);
        mimeType = 'application/json';
      } else {
        // Convert to CSV
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const csvRows = [
            headers.join(','),
            ...data.map(row => 
              headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              }).join(',')
            )
          ];
          content = csvRows.join('\n');
        }
        mimeType = 'text/csv';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  static async getUserAnalytics(userId: string): Promise<any> {
    try {
      const { data: summaries, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('metadata->>generatedBy', userId);

      if (error) throw error;

      return {
        totalAnalyses: summaries.length,
        averageConfidence: summaries.reduce((sum, s) => sum + s.confidence, 0) / summaries.length,
        ethicsFlags: summaries.reduce((total, s) => total + (s.ethics_flags?.length || 0), 0),
        recentActivity: summaries.filter(s => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(s.created_at) > weekAgo;
        }).length
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw new Error('Failed to fetch user analytics');
    }
  }
}