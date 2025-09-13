import React, { useState } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Store pour l'état de l'éditeur
interface EditorState {
  elements: any[];
  selectedId: string | null;
  hoveredId: string | null;
  addElement: (element: any) => void;
  updateElement: (id: string, updates: any) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElement: (fromIndex: number, toIndex: number) => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    elements: [],
    selectedId: null,
    hoveredId: null,
    
    addElement: (element) => set((state) => {
      state.elements.push({
        ...element,
        id: `element-${Date.now()}`
      });
    }),
    
    updateElement: (id, updates) => set((state) => {
      const index = state.elements.findIndex(e => e.id === id);
      if (index !== -1) {
        state.elements[index] = { ...state.elements[index], ...updates };
      }
    }),
    
    deleteElement: (id) => set((state) => {
      state.elements = state.elements.filter(e => e.id !== id);
      if (state.selectedId === id) state.selectedId = null;
    }),
    
    selectElement: (id) => set((state) => {
      state.selectedId = id;
    }),
    
    moveElement: (fromIndex, toIndex) => set((state) => {
      const [moved] = state.elements.splice(fromIndex, 1);
      state.elements.splice(toIndex, 0, moved);
    })
  }))
);

export function EditorCanvas() {
  const { elements, selectedId, selectElement, moveElement } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex(e => e.id === active.id);
      const newIndex = elements.findIndex(e => e.id === over.id);
      moveElement(oldIndex, newIndex);
    }
    
    setIsDragging(false);
  };
  
  return (
    <div className="editor-canvas">
      <DndContext
        sensors={sensors}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <div className="canvas-container">
          <SortableContext
            items={elements.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="canvas-content">
              {elements.map((element) => (
                <EditableElement
                  key={element.id}
                  element={element}
                  isSelected={selectedId === element.id}
                  isDragging={isDragging}
                  onSelect={() => selectElement(element.id)}
                />
              ))}
              
              {elements.length === 0 && (
                <div className="empty-state">
                  <p>Drag components here to start building</p>
                </div>
              )}
            </div>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}

function EditableElement({ element, isSelected, isDragging, onSelect }: any) {
  const { deleteElement } = useEditorStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return <div className="text-element">{element.content || 'Edit text'}</div>;
      case 'button':
        return <button className="button-element">{element.text || 'Button'}</button>;
      case 'image':
        return <img src={element.src || '/placeholder.png'} alt="" />;
      case 'container':
        return <div className="container-element">{element.children}</div>;
      default:
        return <div>Unknown element</div>;
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`editable-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onSelect}
    >
      <div
        style={{
          padding: element.padding || '8px',
          margin: element.margin || '4px',
          backgroundColor: element.backgroundColor || 'transparent'
        }}
      >
        {renderElement()}
      </div>
      
      {isSelected && (
        <div className="selection-controls">
          <button className="control-btn">↑</button>
          <button className="control-btn">↓</button>
          <button 
            className="control-btn" 
            onClick={(e) => {
              e.stopPropagation();
              deleteElement(element.id);
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}