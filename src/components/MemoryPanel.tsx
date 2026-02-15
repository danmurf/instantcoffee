import { useState } from 'react';
import { useMemories } from '../hooks/useMemories';

export function MemoryPanel() {
  const { memories, addMemory, editMemory, removeMemory, isLoading } = useMemories();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formContent, setFormContent] = useState('');

  const resetForm = () => {
    setFormContent('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!formContent.trim()) return;
    await addMemory(formContent.trim());
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingId || !formContent.trim()) return;
    await editMemory(editingId, formContent.trim());
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this memory? This cannot be undone.')) {
      await removeMemory(id);
    }
  };

  const startEdit = (memory: { id?: number; content: string }) => {
    if (!memory.id) return;
    setEditingId(memory.id);
    setFormContent(memory.content);
    setIsAdding(false);
  };

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
          onClick={() => { setFormContent(''); setEditingId(null); setIsAdding(true); }}
          className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
        >
          Add
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId !== null) && (
        <div className="p-3 border-b border-gray-700 bg-gray-800">
          <div className="space-y-2">
            <textarea
              placeholder="e.g., Our team meets on Tuesdays"
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
        {memories.length === 0 && !isAdding ? (
          <p className="text-xs text-gray-500 p-2">
            No memories yet. Add information about your services, teams, and preferences.
          </p>
        ) : (
          <div className="space-y-1">
            {memories.map(memory => (
              <div
                key={memory.id}
                className="group p-2 bg-gray-800 rounded hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <p className="flex-1 min-w-0 text-sm text-gray-300 line-clamp-3">
                    {memory.content}
                  </p>
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
        )}
      </div>
    </div>
  );
}
