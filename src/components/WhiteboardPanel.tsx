/**
 * WhiteboardPanel - Diagram display area
 * 
 * Displays rendered D2 diagrams or shows appropriate states
 * when waiting for input or encountering errors.
 */

import { useState, useEffect } from 'react';

export interface WhiteboardPanelProps {
  /** The rendered SVG diagram to display */
  svg?: string;
  /** Whether a diagram is currently being rendered */
  isLoading?: boolean;
  /** Error message if rendering failed */
  error?: string | null;
}

export function WhiteboardPanel({ svg, isLoading, error }: WhiteboardPanelProps) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  
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
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      if (scale < 1) {
        svgElement.style.width = `${svgWidth * scale}px`;
        svgElement.style.height = `${svgHeight * scale}px`;
      }
    }
  }, [svg, containerRef]);

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
        className="flex h-full w-full items-center justify-center overflow-hidden bg-white p-4"
      >
        <div 
          className="flex h-full w-full items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
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
