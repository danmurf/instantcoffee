import { useState, useEffect, useRef } from 'react';
import { renderMermaid } from '../lib/mermaid';

export interface SourceEditorModalProps {
  isOpen: boolean;
  mermaidSource: string;
  onSave: (newSource: string) => void;
  onClose: () => void;
}

export function SourceEditorModal({
  isOpen,
  mermaidSource,
  onSave,
  onClose,
}: SourceEditorModalProps) {
  const [localSource, setLocalSource] = useState(mermaidSource);
  const [previewSvg, setPreviewSvg] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalSource(mermaidSource);
      setPreviewSvg('');
      setPreviewError(null);
    }
  }, [isOpen, mermaidSource]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsUpdating(true);
    setPreviewError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const svg = await renderMermaid(localSource);
        setPreviewSvg(svg);
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : 'Failed to render preview');
      } finally {
        setIsUpdating(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, localSource]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalSource(e.target.value);
  };

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(localSource);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      <div className="relative z-10 mx-4 flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Mermaid Source
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

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Source</h3>
              <textarea
                ref={textareaRef}
                value={localSource}
                onChange={handleChange}
                className="h-72 w-full resize-none font-mono text-sm bg-gray-50 p-3 text-gray-800 border border-gray-200 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter Mermaid source code..."
                spellCheck={false}
              />
              {isUpdating && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                  Updating...
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Live Preview</h3>
              <div className="flex h-72 w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
                {isUpdating ? (
                  <div className="text-center">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
                    <p className="text-sm text-gray-500">Rendering preview...</p>
                  </div>
                ) : previewError ? (
                  <div className="max-w-xs rounded bg-red-50 p-3 text-center text-sm text-red-600">
                    {previewError}
                  </div>
                ) : previewSvg ? (
                  <div
                    className="flex h-full w-full items-center justify-center p-2"
                    dangerouslySetInnerHTML={{ __html: previewSvg }}
                  />
                ) : (
                  <p className="text-sm text-gray-400">Preview will appear here</p>
                )}
              </div>
            </div>
          </div>
        </div>

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
