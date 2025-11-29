import {
  DndContext,
  DragOverlay,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DndProviderProps {
  children: ReactNode;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onDragCancel: () => void;
  activeId: string | null;
  renderOverlay: (id: string) => ReactNode;
}

export function DndProvider({
  children,
  onDragStart,
  onDragEnd,
  onDragCancel,
  activeId,
  renderOverlay
}: DndProviderProps) {
  const sensors = useSensors(
    // Mouse for desktop
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    // Touch for mobile / tablets
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {children}
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {activeId && renderOverlay(activeId)}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
