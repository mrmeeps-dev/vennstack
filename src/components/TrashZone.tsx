import { Droppable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';

export function TrashZone() {
  return (
    <Droppable droppableId="trash-zone">
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.droppableProps}
          animate={snapshot.isDraggingOver ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50"
        >
          <div
            className={`
              w-14 h-14 rounded-full border-2 border-dashed
              flex items-center justify-center text-2xl 
              transition-all duration-200
              ${snapshot.isDraggingOver 
                ? 'bg-red-500/90 border-red-600 opacity-100 shadow-lg' 
                : 'bg-slate-200/80 border-slate-400 opacity-70'
              }
            `}
          >
            🗑️
          </div>
          {provided.placeholder}
        </motion.div>
      )}
    </Droppable>
  );
}

