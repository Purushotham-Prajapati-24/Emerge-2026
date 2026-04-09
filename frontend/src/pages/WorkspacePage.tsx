import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonacoCollaborative } from '../features/editor/MonacoCollaborative';
import { ExecutionTerminal } from '../features/editor/ExecutionTerminal';
import { AIChatPanel } from '../features/ai/AIChatPanel';
import { ChatPanel } from '../features/collaboration/ChatPanel';
import { CollaboratorsPanel } from '../features/collaboration/CollaboratorsPanel';
import { NotificationBell } from '../components/notifications/NotificationBell';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface Project {
  _id: string;
  title: string;
  language: string;
  owner: { name: string; username: string; avatar: string };
  collaborators: { user: { _id: string; username: string; avatar: string }; role: string }[];
  pendingInvitations?: { user: { _id: string; username: string; avatar: string }; role: string; sentAt: string }[];
}

interface InviteModalProps {
  projectId: string;
  onClose: () => void;
}

const InviteModal = ({ projectId, onClose }: InviteModalProps) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('editor');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await api.post(`/projects/${projectId}/invite`, { username, role });
      setStatus({ type: 'success', msg: `${username} added as ${role}` });
      setUsername('');
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Invite failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0d12]/80 backdrop-blur-[8px]">
      <div className="bg-[#111720] border border-[#1e2a3a] rounded-2xl p-7 w-full max-w-sm shadow-2xl">
        <h3 className="font-['Space_Grotesk'] font-semibold text-lg text-[#f1f3fc] mb-1">Invite Collaborator</h3>
        <p className="text-sm text-[#8a98b3] font-['Inter'] mb-6">Add someone to this workspace.</p>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-mono text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
              placeholder="@developer"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
            >
              <option value="editor">Editor</option>
              <option value="commenter">Commenter</option>
              <option value="reader">Reader</option>
            </select>
          </div>

          {status && (
            <div className={`px-4 py-3 rounded-lg text-sm font-['Inter'] ${
              status.type === 'success'
                ? 'bg-emerald-900/20 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-900/20 border border-red-500/20 text-red-400'
            }`}>
              {status.msg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#8a98b3] font-['Inter'] text-sm hover:text-[#f1f3fc] transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Inviting...' : 'Invite →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function WorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Project['pendingInvitations']>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);

  const fetchProject = async () => {
    if (!projectId) return;
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setProject(data.project);
      setPendingInvites(data.pendingInvitations || []);
    } catch (err) {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#8a98b3] font-['Inter'] text-sm">
          <span className="w-5 h-5 border-2 border-[#3a4458] border-t-[#a78bfa] rounded-full animate-spin" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="h-screen bg-[#0a0d12] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2a3a] flex-shrink-0">
        {/* Left: back + project name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8a98b3] hover:text-[#f1f3fc] hover:bg-[#1e2a3a] transition-all text-sm"
          >
            ←
          </button>
          <div className="w-px h-4 bg-[#1e2a3a]" />
          <h1 className="font-['Space_Grotesk'] font-semibold text-sm text-[#f1f3fc]">{project.title}</h1>
          <span className="px-2 py-0.5 rounded text-xs bg-[#1e2a3a] text-[#8a98b3] font-mono">
            {project.language}
          </span>
        </div>

        {/* Right: collaborators + invite + AI toggle */}
        <div className="flex items-center gap-3">
          {/* Live collaborator avatars (Clickable to open list) */}
          <button 
            onClick={() => { setCollabOpen(o => !o); if (!collabOpen) { setAiOpen(false); setChatOpen(false); } }}
            className={`flex items-center -space-x-1.5 p-1 rounded-xl transition-all hover:bg-[#1e2a3a] ${collabOpen ? 'bg-[#a78bfa]/10 ring-1 ring-[#a78bfa]/30' : ''}`}
          >
            {project.collaborators.slice(0, 5).map((c, i) => (
              c.user.avatar ? (
                <img
                  key={i}
                  src={c.user.avatar}
                  alt={c.user.username}
                  title={c.user.username}
                  className="w-6 h-6 rounded-full border-2 border-[#0a0d12] object-cover"
                />
              ) : (
                <div
                  key={i}
                  title={c.user.username}
                  className="w-6 h-6 rounded-full border-2 border-[#0a0d12] bg-[#1e2a3a] flex items-center justify-center text-[9px] text-[#8a98b3] font-['Inter']"
                >
                  {c.user.username?.[0]?.toUpperCase()}
                </div>
              )
            ))}

            {/* Pending invitations */}
            {pendingInvites?.map((invite, i) => (
              <div 
                key={`pending-${i}`}
                className="relative opacity-40 hover:opacity-100 transition-opacity cursor-help"
                title={`Invitation sent to @${invite.user.username} (Pending)`}
              >
                {invite.user.avatar ? (
                  <img
                    src={invite.user.avatar}
                    alt={invite.user.username}
                    className="w-6 h-6 rounded-full border-2 border-dashed border-[#a78bfa]/50 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-[#a78bfa]/50 bg-[#1e2a3a] flex items-center justify-center text-[9px] text-[#8a98b3] font-['Inter']">
                    {invite.user.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#a78bfa] rounded-full border border-[#0a0d12]" />
              </div>
            ))}
          </button>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-px h-4 bg-[#1e2a3a]" />
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#1e2a3a] text-[#8a98b3] font-['Inter'] hover:border-[#a78bfa]/40 hover:text-[#a78bfa] transition-all"
            >
              + Invite
            </button>
          </div>
          <button
            onClick={() => { setAiOpen(o => !o); if (!aiOpen) { setChatOpen(false); setCollabOpen(false); } }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Inter'] transition-all ${
              aiOpen
                ? 'bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/30'
                : 'bg-[#1e2a3a] text-[#8a98b3] border border-transparent'
            }`}
          >
            🤖 AI
          </button>

          <button
            onClick={() => { setChatOpen(o => !o); if (!chatOpen) { setAiOpen(false); setCollabOpen(false); } }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Inter'] transition-all ${
              chatOpen
                ? 'bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/30'
                : 'bg-[#1e2a3a] text-[#8a98b3] border border-transparent'
            }`}
          >
            💬 Chat
          </button>
        </div>
      </header>

      {/* IDE Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${aiOpen ? 'border-r border-[#1e2a3a]' : ''}`}>
          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            {(() => {
              const myId = useAuthStore.getState().user?._id || useAuthStore.getState().user?.id;
              const myRole = project.collaborators.find(c => c.user._id === myId || c.user === myId)?.role || 'reader';
              
              return (
                <MonacoCollaborative
                  projectId={projectId!}
                  language={project.language}
                  role={myRole}
                />
              );
            })()}
          </div>

          {/* Execution Terminal */}
          <div className="h-48 flex-shrink-0 border-t border-[#1e2a3a]">
            <ExecutionTerminal language={project.language} />
          </div>
        </div>

        {/* Right Sideboards */}
        <div className={`flex transition-all duration-300 ${aiOpen || chatOpen || collabOpen ? 'w-80' : 'w-0'}`}>
          {aiOpen && (
            <div className="w-80 flex-shrink-0 overflow-y-auto h-full">
              <AIChatPanel />
            </div>
          )}
          {chatOpen && (
            <div className="w-80 flex-shrink-0 h-full">
              <ChatPanel />
            </div>
          )}
          {collabOpen && (
            <div className="w-80 flex-shrink-0 h-full">
              <CollaboratorsPanel 
                projectId={projectId!}
                owner={project.owner}
                collaborators={project.collaborators}
                pendingInvites={pendingInvites || []}
                onInviteClick={() => setShowInvite(true)}
                onRefresh={fetchProject}
              />
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && <InviteModal projectId={projectId!} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
