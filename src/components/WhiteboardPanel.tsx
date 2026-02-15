/**
 * WhiteboardPanel - Diagram display area
 * 
 * Displays rendered D2 diagrams or shows appropriate states
 * when waiting for input or encountering errors.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { exportSvg, exportPng } from '../lib/export';

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
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fitScaleRef = useRef<number>(1);
  // Natural (viewBox) dimensions of the SVG, used to resize on zoom
  const naturalSizeRef = useRef<{ w: number; h: number } | null>(null);

  // Read natural dimensions from the diagram SVG's viewBox
  const readNaturalSize = useCallback(() => {
    if (!containerRef) return null;
    const svgEl = containerRef.querySelector('.inline svg');
    if (!svgEl) return null;
    const vb = svgEl.getAttribute('viewBox')?.split(/\s+/);
    if (vb && vb.length === 4) {
      const size = { w: parseFloat(vb[2]), h: parseFloat(vb[3]) };
      if (size.w > 0 && size.h > 0) return size;
    }
    return null;
  }, [containerRef]);

  // Fit diagram to container, used on SVG change and reset
  const fitToView = useCallback(() => {
    if (!containerRef) return;

    const size = readNaturalSize();
    if (!size) return;
    naturalSizeRef.current = size;

    const containerWidth = containerRef.clientWidth;
    const containerHeight = containerRef.clientHeight;
    if (containerWidth === 0 || containerHeight === 0) return;

    const scaleX = containerWidth / size.w;
    const scaleY = containerHeight / size.h;
    const fitScale = Math.min(scaleX, scaleY) * 0.9; // 90% for padding

    fitScaleRef.current = fitScale;
    setScale(fitScale);
    setPanX(0);
    setPanY(0);
  }, [containerRef, readNaturalSize]);

  // Auto-fit when SVG changes
  useEffect(() => {
    if (!svg || !containerRef) return;
    // Use rAF to ensure the SVG is rendered in the DOM before measuring
    const id = requestAnimationFrame(() => fitToView());
    return () => cancelAnimationFrame(id);
  }, [svg, containerRef, fitToView]);

  // Re-render SVG at current zoom size so vectors stay crisp
  useEffect(() => {
    if (!containerRef) return;
    const svgEl = containerRef.querySelector('.inline svg');
    if (!svgEl) return;
    const size = naturalSizeRef.current;
    if (!size) return;
    svgEl.setAttribute('width', String(size.w * scale));
    svgEl.setAttribute('height', String(size.h * scale));
  }, [scale, containerRef, svg]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.1, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev * 0.9, 0.1));
  }, []);

  const handleReset = useCallback(() => {
    fitToView();
  }, [fitToView]);

  // Export handlers
  const handleExportSvg = useCallback(() => {
    if (svg) {
      exportSvg(svg, 'diagram.svg');
      setShowExportDropdown(false);
    }
  }, [svg]);

  const handleExportPng = useCallback(() => {
    if (svg) {
      exportPng(svg, 'diagram.png');
      setShowExportDropdown(false);
    }
  }, [svg]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportDropdown]);

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

  // Ensure the outer SVG has explicit pixel width/height from its viewBox.
  // Mermaid may set width="100%" or omit dimensions entirely, which causes
  // the SVG to collapse or lose its intrinsic size for zoom calculations.
  // Also strip max-width style so CSS transform controls all sizing.
  const processedSvg = svg ? svg.replace(
    /^(<\?xml[^?]*\?>)?\s*<svg([^>]*?)>/,
    (_match, _xmlDecl, attrs) => {
      const vbMatch = attrs.match(/viewBox="[^\s"]*\s+[^\s"]*\s+(\S+)\s+(\S+)"/i);
      if (!vbMatch) return `<svg${attrs}>`;
      const [, vbW, vbH] = vbMatch;
      // Strip existing width/height attrs (including "100%") and max-width from style
      let cleaned = attrs
        .replace(/\b(width|height)\s*=\s*"[^"]*"/g, '')
        .replace(/style="[^"]*"/, (styleAttr) =>
          styleAttr.replace(/max-width:\s*[^;"]+(;?\s*)/g, '')
        )
        .replace(/\s{2,}/g, ' ');
      return `<svg ${cleaned.trim()} width="${vbW}" height="${vbH}">`;
    }
  ) : undefined;

  // SVG display state
  if (processedSvg) {
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
          
          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-gray-200"></div>
          
          {/* Export dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
              title="Export"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown menu */}
            {showExportDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleExportSvg}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as SVG
                </button>
                <button
                  onClick={handleExportPng}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as PNG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-4 left-4 z-10 rounded bg-white px-2 py-1 text-xs text-gray-500 shadow-md">
          {Math.round(scale * 100)}%
        </div>

        {/* Diagram container — pan only, zoom is applied to SVG dimensions */}
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate(${panX}px, ${panY}px)`,
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <div
            className="inline"
            dangerouslySetInnerHTML={{ __html: processedSvg }}
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
