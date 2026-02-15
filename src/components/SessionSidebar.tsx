import { useState } from 'react';
import type { Session } from '../types/session';
import { MemoryPanel } from './MemoryPanel';

interface SessionSidebarProps {
  sessions: Session[];
  currentSessionId: number | null;
  onSelectSession: (id: number) => void;
  onNewSession: () => void;
  onDeleteSession: (id: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Format a timestamp to a relative time string
 */
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
  isCollapsed,
  onToggleCollapse,
}: SessionSidebarProps) {
  const [showMemories, setShowMemories] = useState(false);
  
  const handleSessionClick = (id: number) => {
    onSelectSession(id);
  };
  
  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this session? This cannot be undone.')) {
      onDeleteSession(id);
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
    <div className="w-60 flex-shrink-0 bg-gray-900 flex flex-col border-r border-gray-700">
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
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {session.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(session.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(session.id!, e)}
                    className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
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
        
        {/* Memory panel */}
        <div className={`${showMemories ? 'max-h-80' : 'max-h-0'} overflow-hidden transition-all duration-200`}>
          <div className="h-80 overflow-hidden">
            <MemoryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
