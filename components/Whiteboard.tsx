import React, { useRef, useState, useCallback } from 'react';
import { BoardItem, Position, ItemType, GroupItem } from '../types';
import { ZOOM_MIN, ZOOM_MAX } from '../constants';
import { NoteCard, TaskCard, ExpenseWidget, GroupCard } from './BoardItems';

interface WhiteboardProps {
  items: BoardItem[];
  setItems: React.Dispatch<React.SetStateAction<BoardItem[]>>;
  viewState: { scale: number; offset: Position };
  setViewState: React.Dispatch<React.SetStateAction<{ scale: number; offset: Position }>>;
  isDarkMode: boolean;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ items, setItems, viewState, setViewState, isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - viewState.offset.x) / viewState.scale,
      y: (screenY - viewState.offset.y) / viewState.scale,
    };
  }, [viewState]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    // Check if we clicked an item or a control inside an item
    const clickedItem = target.closest('[data-item-id]');
    
    if (clickedItem && (e.button === 0)) { // Left click on item
      const id = clickedItem.getAttribute('data-item-id');
      if (id) {
        setIsDraggingItem(id);
        setSelectedId(id);
        setDragStart({ x: e.clientX, y: e.clientY });
        
        // Move to front logic: Groups stay behind everything, standard items move to very front
        const itemType = items.find(i => i.id === id)?.type;
        
        setItems(prev => {
          if (itemType === ItemType.GROUP) return prev; // Don't change z-index of groups aggressively

          const others = prev.filter(i => i.id !== id);
          const current = prev.find(i => i.id === id);
          // Standard items above everything (max zIndex + 1)
          const maxZ = prev.length > 0 ? Math.max(...prev.map(p => p.zIndex)) : 1;
          return current ? [...others, { ...current, zIndex: maxZ + 1 }] : prev;
        });

        e.stopPropagation();
        return;
      }
    }

    // Otherwise, pan
    if (e.button === 0 || e.button === 1) { // Left (on bg) or Middle
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setSelectedId(null); // Deselect
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setViewState(prev => ({
        ...prev,
        offset: { x: prev.offset.x + dx, y: prev.offset.y + dy }
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isDraggingItem) {
      const dx = (e.clientX - dragStart.x) / viewState.scale;
      const dy = (e.clientY - dragStart.y) / viewState.scale;
      
      const draggedItem = items.find(i => i.id === isDraggingItem);
      
      setItems(prev => prev.map(item => {
        // Move the item being dragged
        if (item.id === isDraggingItem) {
          return {
            ...item,
            position: { x: item.position.x + dx, y: item.position.y + dy }
          };
        }
        // If we are dragging a Group, move its children too
        if (draggedItem?.type === ItemType.GROUP && item.groupId === isDraggingItem) {
             return {
                ...item,
                position: { x: item.position.x + dx, y: item.position.y + dy }
             };
        }
        return item;
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => {
    if (isDraggingItem) {
        // Check for grouping logic: If an item (not a group) is dropped inside a group
        const draggedItem = items.find(i => i.id === isDraggingItem);
        if (draggedItem && draggedItem.type !== ItemType.GROUP) {
            // Find a group that contains this item's center
            const itemCenterX = draggedItem.position.x + draggedItem.size.width / 2;
            const itemCenterY = draggedItem.position.y + draggedItem.size.height / 2;

            const targetGroup = items.find(g => 
                g.type === ItemType.GROUP &&
                itemCenterX >= g.position.x &&
                itemCenterX <= g.position.x + g.size.width &&
                itemCenterY >= g.position.y &&
                itemCenterY <= g.position.y + g.size.height
            );

            if (targetGroup) {
                // Assign to group
                if (draggedItem.groupId !== targetGroup.id) {
                    setItems(prev => prev.map(i => i.id === draggedItem.id ? { ...i, groupId: targetGroup.id } as BoardItem : i));
                }
            } else {
                // Remove from group if dragged out
                if (draggedItem.groupId) {
                    setItems(prev => prev.map(i => i.id === draggedItem.id ? { ...i, groupId: undefined } as BoardItem : i));
                }
            }
        }
    }

    setIsPanning(false);
    setIsDraggingItem(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom logic
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(viewState.scale + delta, ZOOM_MIN), ZOOM_MAX);
      
      // Zoom towards mouse pointer
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      const worldBefore = screenToWorld(mouseX, mouseY);
      
      const newOffsetX = mouseX - worldBefore.x * newScale;
      const newOffsetY = mouseY - worldBefore.y * newScale;

      setViewState({ scale: newScale, offset: { x: newOffsetX, y: newOffsetY } });
    } else {
        // Pan logic if not zooming
        setViewState(prev => ({
            ...prev,
            offset: { x: prev.offset.x - e.deltaX, y: prev.offset.y - e.deltaY }
        }));
    }
  };

  const updateItem = (id: string, updates: Partial<BoardItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } as BoardItem : item));
  };

  const deleteItem = (id: string) => {
    // If deleting a group, ungroup its children
    const itemToDelete = items.find(i => i.id === id);
    if (itemToDelete?.type === ItemType.GROUP) {
         setItems(prev => prev.filter(i => i.id !== id).map(i => i.groupId === id ? { ...i, groupId: undefined } as BoardItem : i));
    } else {
         setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Sort items to render groups first (behind), then everything else by zIndex
  const sortedItems = [...items].sort((a, b) => {
      if (a.type === ItemType.GROUP && b.type !== ItemType.GROUP) return -1;
      if (a.type !== ItemType.GROUP && b.type === ItemType.GROUP) return 1;
      return a.zIndex - b.zIndex;
  });

  const dotColor = isDarkMode ? '#334155' : '#cbd5e1'; // slate-700 : slate-300

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-50 dark:bg-slate-900 relative overflow-hidden cursor-crosshair touch-none transition-colors duration-200"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      style={{
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: `${20 * viewState.scale}px ${20 * viewState.scale}px`,
        backgroundPosition: `${viewState.offset.x}px ${viewState.offset.y}px`
      }}
    >
      <div 
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.scale})`
        }}
      >
        {sortedItems.map(item => (
          <div
            key={item.id}
            data-item-id={item.id}
            className="absolute transition-shadow"
            style={{
              left: item.position.x,
              top: item.position.y,
              width: item.size.width,
              height: item.size.height,
              zIndex: item.zIndex
            }}
          >
            {item.type === ItemType.NOTE && (
              <NoteCard item={item as any} isSelected={selectedId === item.id} onUpdate={updateItem} onDelete={deleteItem} />
            )}
            {item.type === ItemType.TASK && (
              <TaskCard item={item as any} isSelected={selectedId === item.id} onUpdate={updateItem} onDelete={deleteItem} />
            )}
            {item.type === ItemType.EXPENSE_WIDGET && (
              <ExpenseWidget item={item as any} isSelected={selectedId === item.id} onUpdate={updateItem} onDelete={deleteItem} />
            )}
            {item.type === ItemType.GROUP && (
              <GroupCard item={item as any} isSelected={selectedId === item.id} onUpdate={updateItem} onDelete={deleteItem} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};