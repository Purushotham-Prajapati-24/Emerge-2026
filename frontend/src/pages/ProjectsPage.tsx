import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationBell } from '../components/notifications/NotificationBell';

interface Project {
  _id: string;
  title: string;
  language: string;
  projectType: 'programming' | 'web-development';
  owner: { _id: string; name: string; username: string; avatar: string };
  collaborators: { user: { username: string; avatar: string }; role: string }[];
  createdAt: string;
}

const LANG_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3572a5',
  rust: '#ce422b',
  html: '#e34c26',
  default: '#8a98b3',
};

const LANG_ICONS: Record<string, string> = {
  typescript: 'TS',
  javascript: 'JS',
  python: 'PY',
  rust: 'RS',
  html: 'HTML',
};

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
const DeleteModal = ({
  project,
  onConfirm,
  onCancel,
  loading,
}: {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0d12]/85 backdrop-blur-[10px]">
    <div className="bg-[#111720] border border-[#1e2a3a] rounded-2xl p-7 w-full max-w-sm shadow-2xl">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-xl">
        🗑️
      </div>
      <h3 className="font-['Space_Grotesk'] font-semibold text-lg text-[#f1f3fc] mb-1">
        Delete Project
      </h3>
      <p className="text-sm text-[#8a98b3] font-['Inter'] mb-1">
        Are you sure you want to delete{' '}
        <span className="text-[#f1f3fc] font-semibold">"{project.title}"</span>?
      </p>
      <p className="text-xs text-red-400/80 font-['Inter'] mb-6">
        This action is permanent and cannot be undone. All collaborators will lose access.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#8a98b3] font-['Inter'] text-sm hover:text-[#f1f3fc] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-['Inter'] font-semibold text-sm disabled:opacity-50 transition-all"
        >
          {loading ? 'Deleting...' : 'Delete Project'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({
  project,
  isOwner,
  onOpen,
  onDelete,
  onRename,
}: {
  project: Project;
  isOwner: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(project.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== project.title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const langColor = LANG_COLORS[project.language] || LANG_COLORS.default;
  const langIcon = LANG_ICONS[project.language] || '{}';

  return (
    <div
      className="group relative text-left rounded-xl bg-[#111720] border border-[#1e2a3a] hover:border-[#a78bfa]/30 hover:bg-[#14202e] transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-[2px] w-full" style={{ backgroundColor: langColor + '55' }} />

      {/* Card body — clickable to open */}
      <button
        onClick={onOpen}
        className="w-full text-left p-5 block"
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono"
            style={{ backgroundColor: langColor + '22', color: langColor }}
          >
            {langIcon}
          </div>
          {project.projectType === 'web-development' && (
            <span className="text-[9px] font-['Inter'] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20">
              Web Dev
            </span>
          )}
        </div>

        {/* Title */}
        {editing ? null : (
          <h3 className="font-['Space_Grotesk'] font-semibold text-[#f1f3fc] mb-1 group-hover:text-[#a78bfa] transition-colors truncate pr-2">
            {project.title}
          </h3>
        )}

        {/* Language */}
        <p className="text-xs text-[#3a4458] font-mono mb-4">{project.language}</p>

        {/* Footer */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {project.collaborators.slice(0, 4).map((c, i) =>
              c.user.avatar ? (
                <img key={i} src={c.user.avatar} alt={c.user.username} className="w-5 h-5 rounded-full border border-[#0a0d12] object-cover" />
              ) : (
                <div key={i} className="w-5 h-5 rounded-full border border-[#0a0d12] bg-[#1e2a3a] flex items-center justify-center text-[8px] text-[#8a98b3]">
                  {c.user.username?.[0]?.toUpperCase()}
                </div>
              )
            )}
          </div>
          <span className="text-xs text-[#3a4458] font-['Inter'] ml-auto">
            {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </button>

      {/* Inline rename input (overlays when editing) */}
      {editing && (
        <div className="absolute inset-0 flex items-center px-5 bg-[#0d1117]/95 z-10">
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="w-full bg-transparent border-b-2 border-[#a78bfa] outline-none text-[#f1f3fc] font-['Space_Grotesk'] font-semibold text-base py-1"
          />
        </div>
      )}

      {/* Owner-only action buttons — hover reveal */}
      {isOwner && !editing && (
        <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 z-10">
          <button
            onClick={startEdit}
            title="Rename project"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1e2a3a] hover:bg-[#2d3a4a] text-[#8a98b3] hover:text-[#f1f3fc] transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete project"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1e2a3a] hover:bg-red-900/40 text-[#8a98b3] hover:text-red-400 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
          {!isOwner && (
            <span className="ml-1 text-[9px] text-[#3a4458] font-['Inter'] uppercase tracking-wider">
              shared
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('typescript');
  const [newProjectType, setNewProjectType] = useState<'programming' | 'web-development'>('programming');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const languageToSave = newProjectType === 'web-development' ? 'html' : newLang;
      const { data } = await api.post('/projects', {
        title: newTitle.trim(),
        language: languageToSave,
        projectType: newProjectType,
      });
      setProjects((prev) => [data.project, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewProjectType('programming');
      setNewLang('typescript');
      navigate(`/workspace/${data.project._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (projectId: string, newTitle: string) => {
    try {
      const { data } = await api.patch(`/projects/${projectId}`, { title: newTitle });
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, title: data.project.title } : p))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to rename project');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${deleteTarget._id}`);
      setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/auth');
  };

  const isProjectOwner = (project: Project) =>
    project.owner._id === (user as any)?._id ||
    project.owner._id === (user as any)?.id ||
    project.owner.username === user?.username;

  return (
    <div className="min-h-screen bg-[#0a0d12] text-[#f1f3fc]">
      {/* Top Nav */}
      <nav className="border-b border-[#1e2a3a] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0d12]/90 backdrop-blur-[16px] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-sm font-bold font-mono">E</span>
          </div>
          <span className="text-lg font-semibold font-['Space_Grotesk']">Emerge</span>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <button
            onClick={() => navigate(`/profile/${user?.username}`)}
            className="flex items-center gap-2.5 text-sm text-[#8a98b3] hover:text-[#f1f3fc] font-['Inter'] transition-colors"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1e2a3a] flex items-center justify-center text-xs font-['Inter']">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span>{user?.username}</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-[#3a4458] hover:text-red-400 font-['Inter'] transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Projects</h2>
            <p className="text-[#8a98b3] text-sm font-['Inter']">
              {projects.length > 0
                ? `${projects.length} project${projects.length === 1 ? '' : 's'} in your workspace`
                : 'No projects yet. Create one to get started.'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#7c3aed]/20"
          >
            <span>＋</span>
            New Project
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-['Inter'] flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="text-red-400/60 hover:text-red-400 ml-4">✕</button>
          </div>
        )}

        {/* Project Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-[#111720] animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#111720] border border-[#1e2a3a] flex items-center justify-center mb-5 text-3xl">
              {'</>'}
            </div>
            <h3 className="font-['Space_Grotesk'] font-semibold text-[#f1f3fc] mb-2">No projects yet</h3>
            <p className="text-sm text-[#8a98b3] font-['Inter'] max-w-xs">
              Create your first project and start collaborating with your team in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                isOwner={isProjectOwner(project)}
                onOpen={() => navigate(`/workspace/${project._id}`)}
                onDelete={() => setDeleteTarget(project)}
                onRename={(newTitle) => handleRename(project._id, newTitle)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0d12]/80 backdrop-blur-[8px]">
          <div className="bg-[#111720] border border-[#1e2a3a] rounded-2xl p-7 w-full max-w-sm shadow-2xl">
            <h3 className="font-['Space_Grotesk'] font-semibold text-lg text-[#f1f3fc] mb-1">New Project</h3>
            <p className="text-sm text-[#8a98b3] font-['Inter'] mb-6">
              Give your project a name and pick a language.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                  placeholder="My Awesome App"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Mode</label>
                <div className="flex bg-[#0a0d12] p-1 rounded-lg border border-[#1e2a3a]">
                  <button
                    type="button"
                    onClick={() => setNewProjectType('programming')}
                    className={`flex-1 py-1.5 text-xs font-['Inter'] rounded ${newProjectType === 'programming' ? 'bg-[#1e2a3a] text-[#f1f3fc]' : 'text-[#8a98b3] hover:text-[#f1f3fc]'}`}
                  >
                    Programming
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProjectType('web-development')}
                    className={`flex-1 py-1.5 text-xs font-['Inter'] rounded ${newProjectType === 'web-development' ? 'bg-[#1e2a3a] text-[#f1f3fc]' : 'text-[#8a98b3] hover:text-[#f1f3fc]'}`}
                  >
                    Web Dev
                  </button>
                </div>
              </div>

              {newProjectType === 'programming' && (
                <div>
                  <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Language</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>
              )}

              {newProjectType === 'web-development' && (
                <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-lg p-3">
                  <p className="text-xs text-[#a78bfa] font-['Inter'] leading-relaxed">
                    <strong>Web Development Mode</strong><br />
                    HTML/CSS/JS workspace with AI code generation and live preview.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#8a98b3] font-['Inter'] text-sm hover:text-[#f1f3fc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {creating ? 'Creating...' : 'Create →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          project={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
