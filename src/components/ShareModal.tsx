import React, { useState } from 'react';
import { X, Share2, Copy, Mail, Globe, Lock, Download, MessageSquare, Calendar, Check } from 'lucide-react';
import { ShareLink, ExportOptions } from '../types';
import { CollaborationService } from '../services/collaboration';

interface ShareModalProps {
  summaryId: string;
  paperTitle: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ summaryId, paperTitle, onClose }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'export'>('share');
  const [shareSettings, setShareSettings] = useState({
    isPublic: false,
    allowComments: true,
    allowDownload: false,
    expiresIn: '30' // days
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    sections: {
      summary: true,
      keyPoints: true,
      limitations: true,
      citations: true,
      ethicsAnalysis: true,
      xaiData: false,
      comments: false,
      metadata: true
    },
    includeGraphics: true,
    includeWatermark: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateShareLink = async () => {
    setIsGeneratingLink(true);
    try {
      const expiresAt = shareSettings.expiresIn !== 'never' 
        ? new Date(Date.now() + parseInt(shareSettings.expiresIn) * 24 * 60 * 60 * 1000)
        : undefined;

      const link = await CollaborationService.createShareLink(summaryId, {
        isPublic: shareSettings.isPublic,
        allowComments: shareSettings.allowComments,
        allowDownload: shareSettings.allowDownload,
        expiresAt
      });

      setShareLink(link);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      const url = `${window.location.origin}/shared/${shareLink.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await CollaborationService.inviteCollaborator(summaryId, inviteEmail, 'viewer');
      setInviteEmail('');
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await CollaborationService.exportSummary(summaryId, exportOptions);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export summary');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'share', label: 'Share & Collaborate', icon: Share2 },
    { id: 'export', label: 'Export', icon: Download }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Share2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Analysis</h2>
              <p className="text-sm text-gray-600 truncate max-w-md">{paperTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
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

        <div className="p-6">
          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Share Link Generation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Share Link</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Public Access</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.isPublic}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Allow Comments</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.allowComments}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, allowComments: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Allow Download</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.allowDownload}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Expires In</span>
                    </div>
                    <select
                      value={shareSettings.expiresIn}
                      onChange={(e) => setShareSettings(prev => ({ ...prev, expiresIn: e.target.value }))}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1"
                    >
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isGeneratingLink}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isGeneratingLink ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Generate Link
                      </>
                    )}
                  </button>
                </div>

                {shareLink && (
                  <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                        {window.location.origin}/shared/{shareLink.id}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Invitation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Collaborators</h3>
                <div className="flex space-x-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleInviteByEmail}
                    disabled={!inviteEmail.trim()}
                    className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Invite</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Invited users will receive viewer access and can comment on the analysis.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Export Format */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { value: 'pdf', label: 'PDF', description: 'Formatted document' },
                    { value: 'docx', label: 'HTML', description: 'Web document' },
                    { value: 'markdown', label: 'Markdown', description: 'Plain text format' },
                    { value: 'json', label: 'JSON', description: 'Raw data export' },
                    { value: 'csv', label: 'CSV', description: 'Spreadsheet data' }
                  ].map((format) => (
                    <label key={format.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={exportOptions.format === format.value}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                        className="sr-only"
                      />
                      <div className={`p-3 border rounded-lg text-center transition-colors ${
                        exportOptions.format === format.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Sections */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Include Sections</h3>
                <div className="space-y-3">
                  {[
                    { key: 'summary', label: 'Summary', description: 'Main analysis content' },
                    { key: 'keyPoints', label: 'Key Points', description: 'Important findings' },
                    { key: 'limitations', label: 'Limitations', description: 'Study limitations' },
                    { key: 'citations', label: 'Citations', description: 'Referenced quotes' },
                    { key: 'ethicsAnalysis', label: 'Ethics Analysis', description: 'Bias and ethics flags' },
                    { key: 'xaiData', label: 'XAI Data', description: 'Explainable AI details' },
                    { key: 'comments', label: 'Comments', description: 'Collaborative comments' },
                    { key: 'metadata', label: 'Metadata', description: 'Paper information' }
                  ].map((section) => (
                    <label key={section.key} className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="font-medium text-gray-900">{section.label}</div>
                        <div className="text-sm text-gray-500">{section.description}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={exportOptions.sections[section.key as keyof typeof exportOptions.sections]}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          sections: { ...prev.sections, [section.key]: e.target.checked }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Include Graphics</div>
                      <div className="text-sm text-gray-500">Charts and visualizations</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={exportOptions.includeGraphics}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeGraphics: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Include Watermark</div>
                      <div className="text-sm text-gray-500">SciAI Trust Toolkit branding</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={exportOptions.includeWatermark}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeWatermark: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center space-x-2 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Export Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;