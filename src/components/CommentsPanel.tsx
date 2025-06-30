import React, { useState, useEffect } from 'react';
import { MessageSquare, Reply, MoreVertical, Heart, ThumbsUp, ThumbsDown, HelpCircle, Send, Edit2, Trash2 } from 'lucide-react';
import { Comment, CommentReaction } from '../types';
import { CollaborationService } from '../services/collaboration';

interface CommentsPanelProps {
  summaryId: string;
  targetSection?: 'summary' | 'keyPoints' | 'ethics' | 'xai';
  targetId?: string;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ summaryId, targetSection, targetId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [summaryId, targetSection, targetId]);

  const loadComments = async () => {
    try {
      const fetchedComments = await CollaborationService.getComments(summaryId, targetSection, targetId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await CollaborationService.addComment(summaryId, {
        content: newComment,
        targetSection,
        targetId
      });
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const reply = await CollaborationService.addComment(summaryId, {
        content: replyText,
        targetSection,
        targetId,
        parentId
      });
      setComments(prev => [...prev, reply]);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await CollaborationService.updateComment(commentId, editText);
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editText, updatedAt: new Date() }
          : comment
      ));
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await CollaborationService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleReaction = async (commentId: string, type: CommentReaction['type']) => {
    try {
      await CollaborationService.addReaction(commentId, type);
      // Reload comments to get updated reactions
      loadComments();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      await CollaborationService.resolveComment(commentId);
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, isResolved: !comment.isResolved }
          : comment
      ));
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  const getReactionIcon = (type: CommentReaction['type']) => {
    switch (type) {
      case 'like': return Heart;
      case 'agree': return ThumbsUp;
      case 'disagree': return ThumbsDown;
      case 'question': return HelpCircle;
      default: return Heart;
    }
  };

  const getReactionColor = (type: CommentReaction['type']) => {
    switch (type) {
      case 'like': return 'text-red-500';
      case 'agree': return 'text-green-500';
      case 'disagree': return 'text-red-500';
      case 'question': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const organizeComments = (comments: Comment[]) => {
    const topLevel = comments.filter(comment => !comment.parentId);
    const replies = comments.filter(comment => comment.parentId);
    
    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(reply => reply.parentId === comment.id)
    }));
  };

  const organizedComments = organizeComments(comments);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Collaborative Comments
        </h3>
        <p className="text-blue-700 text-sm">
          Share insights, ask questions, and collaborate with your team on this analysis.
        </p>
      </div>

      {/* New Comment */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or question about this analysis..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm text-gray-500">
            {targetSection && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {targetSection === 'keyPoints' ? 'Key Points' : 
                 targetSection === 'ethics' ? 'Ethics Analysis' :
                 targetSection === 'xai' ? 'XAI Data' : 'Summary'}
              </span>
            )}
          </div>
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Comment</span>
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {organizedComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          organizedComments.map((comment) => (
            <div key={comment.id} className={`bg-white border rounded-lg p-4 ${comment.isResolved ? 'opacity-75' : ''}`}>
              {/* Comment Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {comment.userName?.charAt(0) || comment.userEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {comment.userName || comment.userEmail}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                      {comment.updatedAt && (
                        <span className="ml-2">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {comment.isResolved && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Resolved
                    </span>
                  )}
                  <div className="relative">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Comment Content */}
              <div className="mb-3">
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                        className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>

              {/* Comment Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Reactions */}
                  <div className="flex items-center space-x-2">
                    {(['like', 'agree', 'disagree', 'question'] as const).map((type) => {
                      const Icon = getReactionIcon(type);
                      const count = comment.reactions.filter(r => r.type === type).length;
                      return (
                        <button
                          key={type}
                          onClick={() => handleReaction(comment.id, type)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm hover:bg-gray-100 ${
                            count > 0 ? getReactionColor(type) : 'text-gray-500'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {count > 0 && <span>{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Reply Button */}
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <Reply className="h-4 w-4" />
                    <span>Reply</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleResolveComment(comment.id)}
                    className={`text-sm px-2 py-1 rounded-md ${
                      comment.isResolved 
                        ? 'text-green-600 hover:text-green-800' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {comment.isResolved ? 'Unresolve' : 'Resolve'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditText(comment.content);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-4 pl-8 border-l-2 border-gray-200">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyText.trim() || isSubmitting}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-8 border-l-2 border-gray-200 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {reply.userName?.charAt(0) || reply.userEmail.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reply.userName || reply.userEmail}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsPanel;