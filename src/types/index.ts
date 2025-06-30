export interface Paper {
  id: string;
  title: string;
  authors: string[];
  doi?: string;
  url?: string;
  uploadedFile?: File;
  content?: string;
  metadata?: PaperMetadata;
}

export interface PaperMetadata {
  publishedDate?: string;
  journal?: string;
  citations?: number;
  keywords?: string[];
  abstract?: string;
}

export interface Summary {
  id: string;
  paperId: string;
  content: string;
  keyPoints: KeyPoint[];
  limitations: string[];
  citations: Citation[];
  confidence: number;
  generatedAt: Date;
  ethicsFlags: EthicsFlag[];
  xaiData: XAIData;
  researchGaps?: ResearchGap[];
  isShared?: boolean;
  sharedBy?: string;
  collaborators?: Collaborator[];
}

export interface KeyPoint {
  id: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
  sourceSection: string;
  confidence: number;
}

export interface Citation {
  id: string;
  text: string;
  sourceLocation: string;
  pageNumber?: number;
  confidence: number;
}

export interface EthicsFlag {
  id: string;
  type: 'bias' | 'data-quality' | 'representation' | 'methodology' | 'disclosure';
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  sourceLocation?: string;
}

export interface ResearchGap {
  gap: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedApproach: string;
}

export interface XAIData {
  decisionPathways: DecisionPathway[];
  sourceReferences: SourceReference[];
  confidenceBreakdown: ConfidenceBreakdown;
  attentionWeights: AttentionWeight[];
}

export interface DecisionPathway {
  id: string;
  step: string;
  reasoning: string;
  confidence: number;
  sources: string[];
}

export interface SourceReference {
  id: string;
  originalText: string;
  summaryReference: string;
  relevanceScore: number;
  location: string;
}

export interface ConfidenceBreakdown {
  overall: number;
  keyPoints: number;
  citations: number;
  limitations: number;
}

export interface AttentionWeight {
  text: string;
  weight: number;
  relevance: string;
}

export interface UserFeedback {
  id: string;
  summaryId: string;
  userId?: string;
  rating: number;
  helpful: boolean;
  accuracy: number;
  comments?: string;
  submittedAt: Date;
}

export interface AIUsageDeclaration {
  id: string;
  summaryId: string;
  intendedUse: 'internal-understanding' | 'literature-review' | 'draft-writing' | 'research-planning' | 'other';
  customUse?: string;
  acknowledgement: boolean;
  submittedAt: Date;
}

export interface EducationalContent {
  id: string;
  topic: string;
  title: string;
  content: string;
  type: 'tooltip' | 'modal' | 'link';
  relatedFlags?: string[];
}

// New collaboration and sharing types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  collaborators: Collaborator[];
  papers: string[]; // Paper IDs
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  inviteCode?: string;
}

export interface Collaborator {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  lastActive?: Date;
  permissions: CollaboratorPermissions;
}

export interface CollaboratorPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canExport: boolean;
  canInvite: boolean;
}

export interface Comment {
  id: string;
  summaryId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  content: string;
  targetSection?: 'summary' | 'keyPoints' | 'ethics' | 'xai';
  targetId?: string; // ID of specific key point, ethics flag, etc.
  parentId?: string; // For threaded comments
  createdAt: Date;
  updatedAt?: Date;
  isResolved: boolean;
  reactions: CommentReaction[];
}

export interface CommentReaction {
  userId: string;
  type: 'like' | 'agree' | 'disagree' | 'question';
  createdAt: Date;
}

export interface ShareLink {
  id: string;
  summaryId: string;
  createdBy: string;
  expiresAt?: Date;
  isPublic: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  accessCount: number;
  createdAt: Date;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'markdown' | 'json' | 'csv';
  sections: {
    summary: boolean;
    keyPoints: boolean;
    limitations: boolean;
    citations: boolean;
    ethicsAnalysis: boolean;
    xaiData: boolean;
    comments: boolean;
    metadata: boolean;
  };
  includeGraphics: boolean;
  includeWatermark: boolean;
  customTemplate?: string;
}

export interface ActivityLog {
  id: string;
  workspaceId?: string;
  summaryId?: string;
  userId: string;
  userEmail: string;
  action: 'created' | 'updated' | 'shared' | 'commented' | 'exported' | 'invited' | 'joined';
  details: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'mention' | 'share' | 'invite' | 'update';
  title: string;
  message: string;
  relatedId?: string; // Summary ID, workspace ID, etc.
  isRead: boolean;
  createdAt: Date;
}