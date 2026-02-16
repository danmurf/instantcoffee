import { useState } from 'react';
import type { Session } from '../types/session';
import { MemoryPanel } from './MemoryPanel';

interface SessionSidebarProps {
  sessions: Session[];
  currentSessionId: number | null;
  onSelectSession: (id: number) => void;
  onNewSession: () => void;
  onDeleteSession: (id: number) => void;
  onRenameSession: (id: number, newName: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  memoryEnabled: boolean;
  onMemoryEnabledChange: (enabled: boolean) => void;
  memorySavingEnabled: boolean;
  onMemorySavingEnabledChange: (enabled: boolean) => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  isCollapsed,
  onToggleCollapse,
  memoryEnabled,
  onMemoryEnabledChange,
  memorySavingEnabled,
  onMemorySavingEnabledChange,
}: SessionSidebarProps) {
  const [showMemories, setShowMemories] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  
  const handleSessionClick = (id: number) => {
    if (editingSessionId !== id) {
      onSelectSession(id);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this session? This cannot be undone.')) {
      onDeleteSession(id);
    }
  };

  const handleStartEdit = (id: number, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingName(currentName);
  };

  const handleFinishEdit = (id: number) => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== sessions.find(s => s.id === id)?.name) {
      onRenameSession(id, trimmedName);
    }
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleKeyDown = (id: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit(id);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 bg-gray-900 flex flex-col border-r border-gray-700">
        <button
          onClick={onToggleCollapse}
          className="p-3 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={onNewSession}
          className="p-3 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          title="New session"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-72 flex-shrink-0 bg-gray-900 flex flex-col border-r border-gray-700">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <button
          onClick={onToggleCollapse}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={onNewSession}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Session</span>
        </button>
      </div>
      
      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No sessions yet. Start a new session to begin.
          </div>
        ) : (
          <div className="py-1">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session.id!)}
                className={`group px-3 py-2 cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-indigo-900/50 border-l-2 border-indigo-500'
                    : 'hover:bg-gray-800 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0 pr-1">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleFinishEdit(session.id!)}
                        onKeyDown={(e) => handleKeyDown(session.id!, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-1 py-0.5 text-sm font-medium text-gray-200 bg-gray-800 border border-indigo-500 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-sm font-medium text-gray-200 truncate"
                        title={session.name}
                      >
                        {session.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(session.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingSessionId !== session.id && (
                      <button
                        onClick={(e) => handleStartEdit(session.id!, session.name, e)}
                        className="p-1 text-gray-500 hover:text-indigo-400"
                        title="Rename session"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(session.id!, e)}
                      className="p-1 text-gray-500 hover:text-red-400"
                      title="Delete session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Memories toggle */}
      <div className="border-t border-gray-700">
        <button
          onClick={() => setShowMemories(!showMemories)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        >
          <span>Memories</span>
          <svg
            className={`w-4 h-4 transition-transform ${showMemories ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Memory toggles and panel */}
        <div className={`${showMemories ? 'max-h-[26rem]' : 'max-h-0'} overflow-hidden transition-all duration-200`}>
          <div className="px-3 py-2 space-y-2 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Read from memory</span>
              <button
                role="switch"
                aria-checked={memoryEnabled}
                onClick={() => onMemoryEnabledChange(!memoryEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  memoryEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    memoryEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Remember new details</span>
              <button
                role="switch"
                aria-checked={memorySavingEnabled}
                onClick={() => onMemorySavingEnabledChange(!memorySavingEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  memorySavingEnabled ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    memorySavingEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="h-80 overflow-hidden">
            <MemoryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
