/**
 * WhiteboardPanel - Diagram display area
 * 
 * Displays rendered D2 diagrams or shows appropriate states
 * when waiting for input or encountering errors.
 */

import { useState, useEffect, useCallback } from 'react';

export interface WhiteboardPanelProps {
  /** The rendered SVG diagram to display */
  svg?: string;
  /** Whether a diagram is currently being rendered */
  isLoading?: boolean;
  /** Error message if rendering failed */
  error?: string | null;
  /** Callback for undo action */
  onUndo?: () => void;
  /** Callback for redo action */
  onRedo?: () => void;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Whether redo is available */
  canRedo?: boolean;
}

export function WhiteboardPanel({ 
  svg, 
  isLoading, 
  error,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: WhiteboardPanelProps) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number } | null>(null);
  const [initialPan, setInitialPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset transform when SVG changes
  useEffect(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, [svg]);

  // Auto-scale SVG to fit container
  useEffect(() => {
    if (!svg || !containerRef) return;
    
    const svgElement = containerRef.querySelector('svg');
    if (!svgElement) return;
    
    const containerWidth = containerRef.clientWidth;
    const containerHeight = containerRef.clientHeight;
    const svgWidth = parseFloat(svgElement.getAttribute('width') || '0') || svgElement.clientWidth;
    const svgHeight = parseFloat(svgElement.getAttribute('height') || '0') || svgElement.clientHeight;
    
    if (svgWidth > 0 && svgHeight > 0) {
      const scaleX = containerWidth / svgWidth;
      const scaleY = containerHeight / svgHeight;
      const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      if (fitScale < 1) {
        svgElement.style.width = `${svgWidth * fitScale}px`;
        svgElement.style.height = `${svgHeight * fitScale}px`;
      }
    }
  }, [svg, containerRef]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.1, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev * 0.9, 0.1));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Zoom with trackpad pinch or Ctrl+wheel
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) < 10) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
    }
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning on left click and not on button clicks
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsPanning(true);
    setStartPan({ x: e.clientX, y: e.clientY });
    setInitialPan({ x: panX, y: panY });
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !startPan) return;
    
    const deltaX = e.clientX - startPan.x;
    const deltaY = e.clientY - startPan.y;
    setPanX(initialPan.x + deltaX);
    setPanY(initialPan.y + deltaY);
  }, [isPanning, startPan, initialPan]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setStartPan(null);
  }, []);

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="mb-3 text-4xl">⚠️</div>
          <h3 className="mb-2 text-lg font-medium text-red-900">
            Failed to render diagram
          </h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
          <p className="text-sm text-gray-500">Rendering diagram...</p>
        </div>
      </div>
    );
  }

  // SVG display state
  if (svg) {
    return (
      <div 
        ref={setContainerRef}
        className="relative h-full w-full overflow-hidden bg-white"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Toolbar */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg bg-white p-1 shadow-md">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
            title="Zoom Out"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
            title="Zoom In"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={handleReset}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
            title="Reset View"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          
          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-gray-200"></div>
          
          {/* Undo/Redo controls */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex h-8 w-8 items-center justify-center rounded ${
              canUndo 
                ? 'text-gray-700 hover:bg-gray-100' 
                : 'cursor-not-allowed opacity-50'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex h-8 w-8 items-center justify-center rounded ${
              canRedo 
                ? 'text-gray-700 hover:bg-gray-100' 
                : 'cursor-not-allowed opacity-50'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-4 left-4 z-10 rounded bg-white px-2 py-1 text-xs text-gray-500 shadow-md">
          {Math.round(scale * 100)}%
        </div>

        {/* Diagram container with transform */}
        <div 
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <div 
            className="flex h-full w-full items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>
    );
  }

  // Empty state (default)
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 text-6xl">📋</div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Whiteboard
        </h3>
        <p className="max-w-xs text-sm text-gray-500">
          Your diagram will appear here once you send a message.
        </p>
      </div>
    </div>
  );
}
