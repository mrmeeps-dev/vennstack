import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface DndProviderProps {
  children: ReactNode;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onDragCancel: () => void;
  activeId: string | null;
  renderOverlay: (id: string) => ReactNode;
  canScrollWordPool?: boolean;
}

export function DndProvider({
  children,
  onDragStart,
  onDragEnd,
  onDragCancel,
  activeId,
  renderOverlay,
  canScrollWordPool = true
}: DndProviderProps) {
  // Dynamically adjust drag activation distance based on scroll state
  // When scrolling is available, use higher distance to prevent accidental drags
  // When no scrolling is needed (few cards left), use very small distance for responsive dragging
  // Memoize the activation constraint config, but call hooks at top level
  const sensorConfig = useMemo(
    () => ({
      activationConstraint: {
        // Use higher distance when scrolling is possible to prevent "ghost drags"
        // Use very small distance when no scrolling to allow responsive horizontal dragging
        // while still preventing accidental drags from tiny movements
        distance: canScrollWordPool ? 15 : 1,
      },
    }),
    [canScrollWordPool]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, sensorConfig)
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
        <DragOverlay dropAnimation={null} zIndex={100}>
          {activeId && renderOverlay(activeId)}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
