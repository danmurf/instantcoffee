import { useState } from 'react';
import { useMemories } from '../hooks/useMemories';
import type { MemoryCategory } from '../types/memory';

const CATEGORIES: MemoryCategory[] = ['service', 'team', 'preference', 'general'];

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function MemoryPanel() {
  const { memories, addMemory, editMemory, removeMemory, isLoading } = useMemories();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formCategory, setFormCategory] = useState<MemoryCategory>('general');
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  
  const resetForm = () => {
    setFormCategory('general');
    setFormName('');
    setFormContent('');
    setIsAdding(false);
    setEditingId(null);
  };
  
  const handleAdd = async () => {
    if (!formName.trim() || !formContent.trim()) return;
    
    await addMemory(formCategory, formName.trim(), formContent.trim());
    resetForm();
  };
  
  const handleEdit = async () => {
    if (!editingId || !formName.trim() || !formContent.trim()) return;
    
    await editMemory(editingId, {
      category: formCategory,
      name: formName.trim(),
      content: formContent.trim(),
    });
    resetForm();
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this memory? This cannot be undone.')) {
      await removeMemory(id);
    }
  };
  
  const startEdit = (memory: { id?: number; category: MemoryCategory; name: string; content: string }) => {
    if (!memory.id) return;
    setEditingId(memory.id);
    setFormCategory(memory.category);
    setFormName(memory.name);
    setFormContent(memory.content);
    setIsAdding(false);
  };
  
  // Group memories by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = memories.filter(m => m.category === cat);
    return acc;
  }, {} as Record<MemoryCategory, typeof memories>);
  
  const hasAnyMemories = memories.length > 0;
  
  if (isLoading) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        Loading memories...
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-200">Memories</h3>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
          className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
        >
          Add
        </button>
      </div>
      
      {/* Add/Edit Form */}
      {(isAdding || editingId !== null) && (
        <div className="p-3 border-b border-gray-700 bg-gray-800">
          <div className="space-y-2">
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{formatCategory(cat)}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Name (e.g., auth-service)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500"
            />
            <textarea
              placeholder="Content (e.g., owned by Platform team)"
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={editingId !== null ? handleEdit : handleAdd}
                className="flex-1 text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
              >
                {editingId !== null ? 'Save' : 'Add'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-2">
        {!hasAnyMemories && !isAdding ? (
          <p className="text-xs text-gray-500 p-2">
            No memories yet. Add information about your services, teams, and preferences.
          </p>
        ) : (
          <div className="space-y-3">
            {CATEGORIES.map(category => {
              const categoryMemories = grouped[category];
              if (categoryMemories.length === 0) return null;
              
              return (
                <div key={category}>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-1">
                    {formatCategory(category)}
                  </h4>
                  <div className="space-y-1">
                    {categoryMemories.map(memory => (
                      <div
                        key={memory.id}
                        className="group p-2 bg-gray-800 rounded hover:bg-gray-750 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {memory.name}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-2">
                              {memory.content}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(memory)}
                              className="p-1 text-gray-400 hover:text-gray-200"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(memory.id!)}
                              className="p-1 text-gray-400 hover:text-red-400"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
