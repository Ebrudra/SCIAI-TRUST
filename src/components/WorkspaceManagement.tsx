import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Settings, 
  Share2, 
  FileText, 
  Crown, 
  UserPlus, 
  Copy, 
  Check,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Lock,
  Globe,
  Calendar,
  Activity,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CollaborationService } from '../services/collaboration';
import { Workspace, Collaborator, ActivityLog } from '../types';

const WorkspaceManagement: React.FC = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceActivity(selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to get user's workspaces
      // For now, using mock data
      const mockWorkspaces: Workspace[] = [
        {
          id: '1',
          name: 'AI Ethics Research',
          description: 'Collaborative research on AI ethics and bias detection',
          ownerId: user?.id || '',
          collaborators: [
            {
              id: '1',
              email: 'colleague@university.edu',
              name: 'Dr. Sarah Johnson',
              role: 'editor',
              joinedAt: new Date('2024-01-15'),
              permissions: {
                canEdit: true,
                canComment: true,
                canShare: true,
                canExport: true,
                canInvite: false
              }
            },
            {
              id: '2',
              email: 'student@university.edu',
              name: 'Alex Chen',
              role: 'viewer',
              joinedAt: new Date('2024-02-01'),
              permissions: {
                canEdit: false,
                canComment: true,
                canShare: false,
                canExport: false,
                canInvite: false
              }
            }
          ],
          papers: ['paper1', 'paper2', 'paper3'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-03-15'),
          isPublic: false,
          inviteCode: 'abc123def'
        },
        {
          id: '2',
          name: 'Healthcare AI Studies',
          description: 'Research collaboration on AI applications in healthcare',
          ownerId: user?.id || '',
          collaborators: [
            {
              id: '3',
              email: 'doctor@hospital.com',
              name: 'Dr. Michael Rodriguez',
              role: 'editor',
              joinedAt: new Date('2024-02-10'),
              permissions: {
                canEdit: true,
                canComment: true,
                canShare: true,
                canExport: true,
                canInvite: true
              }
            }
          ],
          papers: ['paper4', 'paper5'],
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-03-10'),
          isPublic: true,
          inviteCode: 'xyz789ghi'
        }
      ];
      setWorkspaces(mockWorkspaces);
      if (mockWorkspaces.length > 0) {
        setSelectedWorkspace(mockWorkspaces[0]);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceActivity = async (workspaceId: string) => {
    try {
      // TODO: Implement API call to get workspace activity
      // For now, using mock data
      const mockActivity: ActivityLog[] = [
        {
          id: '1',
          workspaceId,
          userId: user?.id || '',
          userEmail: user?.email || '',
          action: 'created',
          details: 'Created new analysis for "Machine Learning Ethics in Healthcare"',
          createdAt: new Date('2024-03-15T10:30:00'),
          metadata: { paperTitle: 'Machine Learning Ethics in Healthcare' }
        },
        {
          id: '2',
          workspaceId,
          userId: 'colleague-id',
          userEmail: 'colleague@university.edu',
          action: 'commented',
          details: 'Added comment on ethics analysis section',
          createdAt: new Date('2024-03-14T15:45:00'),
          metadata: { section: 'ethics' }
        },
        {
          id: '3',
          workspaceId,
          userId: user?.id || '',
          userEmail: user?.email || '',
          action: 'shared',
          details: 'Shared analysis with external reviewer',
          createdAt: new Date('2024-03-13T09:15:00'),
          metadata: { shareType: 'external' }
        }
      ];
      setActivityLogs(mockActivity);
    } catch (error) {
      console.error('Error loading workspace activity:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) return;

    try {
      const workspace = await CollaborationService.createWorkspace(
        newWorkspace.name,
        newWorkspace.description
      );
      setWorkspaces(prev => [workspace, ...prev]);
      setSelectedWorkspace(workspace);
      setShowCreateModal(false);
      setNewWorkspace({ name: '', description: '', isPublic: false });
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Failed to create workspace');
    }
  };

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim() || !selectedWorkspace) return;

    try {
      await CollaborationService.inviteCollaborator(
        selectedWorkspace.id,
        inviteEmail,
        inviteRole
      );
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      alert('Failed to send invitation');
    }
  };

  const copyInviteCode = async () => {
    if (selectedWorkspace?.inviteCode) {
      await navigator.clipboard.writeText(selectedWorkspace.inviteCode);
      setCopiedInviteCode(true);
      setTimeout(() => setCopiedInviteCode(false), 2000);
    }
  };

  const getActivityIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'created': return <Plus className="h-4 w-4 text-green-500" />;
      case 'updated': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'shared': return <Share2 className="h-4 w-4 text-purple-500" />;
      case 'commented': return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'invited': return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case 'joined': return <Users className="h-4 w-4 text-teal-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to access workspace management.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
              <p className="text-sm text-gray-600">Collaborate on research projects</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>New Workspace</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspace List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Workspaces</h3>
              </div>
              
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => setSelectedWorkspace(workspace)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedWorkspace?.id === workspace.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {workspace.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {workspace.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{workspace.collaborators.length + 1}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span>{workspace.papers.length}</span>
                            </div>
                            {workspace.isPublic ? (
                              <Globe className="h-3 w-3 text-green-500" />
                            ) : (
                              <Lock className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <Crown className="h-4 w-4 text-yellow-500 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workspace Details */}
          <div className="lg:col-span-2">
            {selectedWorkspace ? (
              <div className="space-y-6">
                {/* Workspace Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedWorkspace.name}
                      </h2>
                      <p className="text-gray-600 mt-1">{selectedWorkspace.description}</p>
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {selectedWorkspace.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {selectedWorkspace.isPublic ? (
                            <>
                              <Globe className="h-4 w-4 text-green-500" />
                              <span>Public</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              <span>Private</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Invite</span>
                      </button>
                      <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collaborators */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Collaborators ({selectedWorkspace.collaborators.length + 1})
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Owner */}
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Crown className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                            <p className="text-xs text-gray-500">Owner</p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Owner
                        </span>
                      </div>

                      {/* Collaborators */}
                      {selectedWorkspace.collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {collaborator.name?.charAt(0) || collaborator.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {collaborator.name || collaborator.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                Joined {collaborator.joinedAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              collaborator.role === 'editor' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {collaborator.role}
                            </span>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invite Code */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Invite Code</p>
                          <p className="text-xs text-gray-500">Share this code for quick access</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="px-2 py-1 bg-white border rounded text-sm">
                            {selectedWorkspace.inviteCode}
                          </code>
                          <button
                            onClick={copyInviteCode}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {copiedInviteCode ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="p-4">
                    {activityLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getActivityIcon(log.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{log.details}</p>
                              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                <span>{log.userEmail}</span>
                                <span>•</span>
                                <span>{log.createdAt.toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{log.createdAt.toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workspace</h3>
                <p className="text-gray-600">Choose a workspace from the list to view details and manage collaborators.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Workspace</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={newWorkspace.name}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter workspace name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newWorkspace.description}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your workspace"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newWorkspace.isPublic}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                    Make this workspace public
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspace.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Collaborator Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Collaborator</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="colleague@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="viewer">Viewer - Can view and comment</option>
                    <option value="editor">Editor - Can edit and manage</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteCollaborator}
                  disabled={!inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManagement;