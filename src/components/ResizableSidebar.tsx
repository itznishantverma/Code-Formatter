import { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

export function ResizableSidebar({
  children,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth = 300
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;

      const touch = e.touches[0];
      const newWidth = touch.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    const handleTouchEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

  return (
    <div
      ref={sidebarRef}
      className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden"
      style={{ width: `${width}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px` }}
    >
      {children}
      <div
        onMouseDown={() => setIsResizing(true)}
        onTouchStart={() => setIsResizing(true)}
        className={`absolute top-0 right-0 w-2 h-full cursor-col-resize group hover:bg-blue-500/50 active:bg-blue-500 transition-colors ${
          isResizing ? 'bg-blue-500' : 'bg-slate-600/30'
        }`}
      >
        <div className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 bg-slate-700 group-hover:bg-blue-500 group-active:bg-blue-600 rounded-full p-1.5 shadow-lg transition-all ${
          isResizing ? 'opacity-100 scale-110' : 'opacity-60 group-hover:opacity-100'
        }`}>
          <GripVertical className="w-3 h-3 text-slate-300" />
        </div>
      </div>
    </div>
  );
}
