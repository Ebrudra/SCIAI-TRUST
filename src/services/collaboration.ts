import { createClient } from '@supabase/supabase-js';
import { 
  ShareLink, 
  Comment, 
  CommentReaction, 
  ExportOptions, 
  Workspace, 
  Collaborator,
  ActivityLog,
  Notification
} from '../types';
import { ExportService } from './exportService';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export class CollaborationService {
  // Share Link Management
  static async createShareLink(summaryId: string, options: {
    isPublic: boolean;
    allowComments: boolean;
    allowDownload: boolean;
    expiresAt?: Date;
  }): Promise<ShareLink> {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .insert({
          summary_id: summaryId,
          created_by: 'current-user', // TODO: Get from auth
          expires_at: options.expiresAt?.toISOString(),
          is_public: options.isPublic,
          allow_comments: options.allowComments,
          allow_download: options.allowDownload,
          access_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        summaryId: data.summary_id,
        createdBy: data.created_by,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        isPublic: data.is_public,
        allowComments: data.allow_comments,
        allowDownload: data.allow_download,
        accessCount: data.access_count,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error creating share link:', error);
      throw new Error('Failed to create share link');
    }
  }

  static async getShareLink(linkId: string): Promise<ShareLink | null> {
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (error || !data) return null;

      // Increment access count
      await supabase
        .from('share_links')
        .update({ access_count: data.access_count + 1 })
        .eq('id', linkId);

      return {
        id: data.id,
        summaryId: data.summary_id,
        createdBy: data.created_by,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        isPublic: data.is_public,
        allowComments: data.allow_comments,
        allowDownload: data.allow_download,
        accessCount: data.access_count + 1,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error fetching share link:', error);
      return null;
    }
  }

  // Comments Management
  static async getComments(
    summaryId: string, 
    targetSection?: string, 
    targetId?: string
  ): Promise<Comment[]> {
    try {
      let query = supabase
        .from('comments')
        .select('*')
        .eq('summary_id', summaryId)
        .order('created_at', { ascending: true });

      if (targetSection) {
        query = query.eq('target_section', targetSection);
      }

      if (targetId) {
        query = query.eq('target_id', targetId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(comment => ({
        id: comment.id,
        summaryId: comment.summary_id,
        userId: comment.user_id,
        userEmail: comment.user_email,
        userName: comment.user_name,
        content: comment.content,
        targetSection: comment.target_section,
        targetId: comment.target_id,
        parentId: comment.parent_id,
        createdAt: new Date(comment.created_at),
        updatedAt: comment.updated_at ? new Date(comment.updated_at) : undefined,
        isResolved: comment.is_resolved,
        reactions: comment.reactions || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }

  static async addComment(summaryId: string, commentData: {
    content: string;
    targetSection?: string;
    targetId?: string;
    parentId?: string;
  }): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          summary_id: summaryId,
          user_id: 'current-user', // TODO: Get from auth
          user_email: 'user@example.com', // TODO: Get from auth
          user_name: 'Current User', // TODO: Get from auth
          content: commentData.content,
          target_section: commentData.targetSection,
          target_id: commentData.targetId,
          parent_id: commentData.parentId,
          is_resolved: false,
          reactions: []
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        summaryId: data.summary_id,
        userId: data.user_id,
        userEmail: data.user_email,
        userName: data.user_name,
        content: data.content,
        targetSection: data.target_section,
        targetId: data.target_id,
        parentId: data.parent_id,
        createdAt: new Date(data.created_at),
        isResolved: data.is_resolved,
        reactions: data.reactions || []
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  static async updateComment(commentId: string, content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  static async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  static async resolveComment(commentId: string): Promise<void> {
    try {
      // First get current resolved status
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('is_resolved')
        .eq('id', commentId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle resolved status
      const { error } = await supabase
        .from('comments')
        .update({ is_resolved: !comment.is_resolved })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw new Error('Failed to resolve comment');
    }
  }

  static async addReaction(commentId: string, type: CommentReaction['type']): Promise<void> {
    try {
      // Get current reactions
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('reactions')
        .eq('id', commentId)
        .single();

      if (fetchError) throw fetchError;

      const reactions = comment.reactions || [];
      const userId = 'current-user'; // TODO: Get from auth

      // Remove existing reaction from this user
      const filteredReactions = reactions.filter((r: any) => r.userId !== userId);

      // Add new reaction
      const newReaction = {
        userId,
        type,
        createdAt: new Date().toISOString()
      };

      const updatedReactions = [...filteredReactions, newReaction];

      const { error } = await supabase
        .from('comments')
        .update({ reactions: updatedReactions })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  // Collaboration Management
  static async inviteCollaborator(
    summaryId: string, 
    email: string, 
    role: 'viewer' | 'editor'
  ): Promise<void> {
    try {
      // In a real implementation, this would send an email invitation
      // For now, we'll just create a notification
      await this.createNotification(email, {
        type: 'invite',
        title: 'Collaboration Invitation',
        message: `You've been invited to collaborate on a research analysis`,
        relatedId: summaryId
      });

      console.log(`Invitation sent to ${email} with role ${role}`);
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      throw new Error('Failed to send invitation');
    }
  }

  // Export Management
  static async exportSummary(summaryId: string, options: ExportOptions): Promise<void> {
    try {
      // Fetch the summary and paper data from the database
      const { data: summary, error: summaryError } = await supabase
        .from('summaries')
        .select(`
          *,
          papers (*)
        `)
        .eq('id', summaryId)
        .single();

      if (summaryError || !summary) {
        throw new Error('Summary not found');
      }

      // Transform database data to application types
      const summaryData = {
        id: summary.id,
        paperId: summary.paper_id,
        content: summary.content,
        keyPoints: summary.key_points.map((kp: any, index: number) => ({
          id: `kp-${summary.id}-${index}`,
          ...kp
        })),
        limitations: summary.limitations,
        citations: summary.citations.map((c: any, index: number) => ({
          id: `c-${summary.id}-${index}`,
          ...c
        })),
        confidence: summary.confidence,
        generatedAt: new Date(summary.created_at),
        ethicsFlags: summary.ethics_flags.map((ef: any, index: number) => ({
          id: `ef-${summary.id}-${index}`,
          ...ef
        })),
        xaiData: summary.xai_data
      };

      const paperData = {
        id: summary.papers.id,
        title: summary.papers.title,
        authors: summary.papers.authors,
        doi: summary.papers.doi,
        url: summary.papers.url,
        content: summary.papers.content,
        metadata: summary.papers.metadata
      };

      // Fetch comments if requested
      if (options.sections.comments) {
        const comments = await this.getComments(summaryId);
        (summaryData as any).comments = comments;
      }

      // Use the ExportService to generate the export
      await ExportService.exportSummary(summaryData, paperData, options);

      // Log the export activity
      await this.logActivity({
        summaryId,
        action: 'exported',
        details: `Exported summary in ${options.format} format`,
        metadata: { format: options.format, sections: options.sections }
      });

    } catch (error) {
      console.error('Error exporting summary:', error);
      throw new Error('Failed to export summary');
    }
  }

  // Workspace Management
  static async createWorkspace(name: string, description?: string): Promise<Workspace> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          description,
          owner_id: 'current-user', // TODO: Get from auth
          is_public: false,
          papers: [],
          collaborators: []
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        ownerId: data.owner_id,
        collaborators: data.collaborators || [],
        papers: data.papers || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        isPublic: data.is_public,
        inviteCode: data.invite_code
      };
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw new Error('Failed to create workspace');
    }
  }

  // Notification Management
  static async createNotification(userId: string, notification: {
    type: Notification['type'];
    title: string;
    message: string;
    relatedId?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          related_id: notification.relatedId,
          is_read: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedId: notification.related_id,
        isRead: notification.is_read,
        createdAt: new Date(notification.created_at)
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  // Activity Logging
  static async logActivity(activity: {
    workspaceId?: string;
    summaryId?: string;
    action: ActivityLog['action'];
    details: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          workspace_id: activity.workspaceId,
          summary_id: activity.summaryId,
          user_id: 'current-user', // TODO: Get from auth
          user_email: 'user@example.com', // TODO: Get from auth
          action: activity.action,
          details: activity.details,
          metadata: activity.metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error for logging failures
    }
  }
}