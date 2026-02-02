import { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  theme?: 'light' | 'dark';
}

export function ResizableSidebar({
  children,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth = 300,
  theme = 'dark'
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

  const bgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50';
  const borderClass = theme === 'dark' ? 'border-zinc-800' : 'border-gray-200';
  const handleBgClass = theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300';
  const handleHoverClass = theme === 'dark' ? 'group-hover:bg-blue-500' : 'group-hover:bg-blue-500';
  const gripTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div
      ref={sidebarRef}
      className={`relative ${bgClass} backdrop-blur-sm rounded-2xl shadow-2xl border ${borderClass} flex flex-col`}
      style={{ width: `${width}px`, minWidth: `${minWidth}px`, maxWidth: `${maxWidth}px`, height: '100%' }}
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
      <div
        onMouseDown={() => setIsResizing(true)}
        onTouchStart={() => setIsResizing(true)}
        className={`absolute top-0 right-0 w-2 h-full cursor-col-resize group hover:bg-blue-500/50 active:bg-blue-500 transition-colors ${
          isResizing ? 'bg-blue-500' : theme === 'dark' ? 'bg-zinc-700/30' : 'bg-gray-300/50'
        }`}
      >
        <div className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 ${handleBgClass} ${handleHoverClass} group-active:bg-blue-600 rounded-full p-1.5 shadow-lg transition-all ${
          isResizing ? 'opacity-100 scale-110' : 'opacity-60 group-hover:opacity-100'
        }`}>
          <GripVertical className={`w-3 h-3 ${gripTextClass}`} />
        </div>
      </div>
    </div>
  );
}
