import { useState, useEffect, useRef } from 'react';

export interface SourceEditorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The current D2 source code */
  d2Source: string;
  /** Callback when user saves edited source */
  onSave: (newSource: string) => void;
  /** Callback when user closes the modal */
  onClose: () => void;
  /** Callback for debounced preview updates */
  onPreview?: (newSource: string) => void;
}

export function SourceEditorModal({
  isOpen,
  d2Source,
  onSave,
  onClose,
  onPreview,
}: SourceEditorModalProps) {
  const [localSource, setLocalSource] = useState(d2Source);
  const [isUpdating, setIsUpdating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when d2Source changes from outside
  useEffect(() => {
    if (isOpen) {
      setLocalSource(d2Source);
    }
  }, [isOpen, d2Source]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Handle textarea changes with debounce for live preview
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalSource(newValue);

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce timer for preview
    if (onPreview) {
      setIsUpdating(true);
      debounceRef.current = setTimeout(() => {
        onPreview(newValue);
        setIsUpdating(false);
      }, 300);
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(localSource);
  };

  const handleClose = () => {
    // Discard changes and close (per user decision in plan)
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal content */}
      <div className="relative z-10 mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit D2 Source
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={localSource}
              onChange={handleChange}
              className="h-64 w-full resize-none font-mono text-sm bg-gray-50 p-3 text-gray-800 border border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter D2 source code..."
              spellCheck={false}
            />
            {/* Preview updating indicator */}
            {isUpdating && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                Preview updating...
              </div>
            )}
          </div>

          {/* Preview area */}
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">Live Preview</h3>
            <div className="flex h-48 w-full items-center justify-center rounded border border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-400">
                {isUpdating ? 'Updating preview...' : 'Preview will appear here'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
