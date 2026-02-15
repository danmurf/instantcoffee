import { useState, useRef, useEffect, ReactNode } from 'react';

interface LayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  leftPanelDefaultWidth?: number;
  sidebar?: ReactNode;
}

export function Layout({ 
  leftPanel, 
  rightPanel, 
  leftPanelDefaultWidth = 33,
  sidebar,
}: LayoutProps) {
  const [leftWidth, setLeftWidth] = useState(leftPanelDefaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Clamp between 20% and 60%
      setLeftWidth(Math.max(20, Math.min(60, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="flex h-screen w-full bg-white"
    >
      {/* Sidebar */}
      {sidebar}

      {/* Mobile: Stack vertically */}
      <div className="flex w-full flex-col md:hidden">
        <div className="h-1/2 overflow-hidden border-b border-gray-200">
          {leftPanel}
        </div>
        <div className="h-1/2 overflow-hidden bg-gray-50">
          {rightPanel}
        </div>
      </div>

      {/* Desktop: Side-by-side with resizable divider */}
      <div className="hidden md:flex md:w-full">
        {/* Left Panel */}
        <div 
          className="h-full overflow-hidden border-r border-gray-200"
          style={{ width: `${leftWidth}%` }}
        >
          {leftPanel}
        </div>

        {/* Resizable Divider */}
        <div
          className={`h-full w-1 cursor-col-resize bg-gray-200 hover:bg-indigo-500 transition-colors ${
            isDragging ? 'bg-indigo-500' : ''
          }`}
          onMouseDown={() => setIsDragging(true)}
        />

        {/* Right Panel */}
        <div 
          className="h-full overflow-hidden bg-gray-50"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
