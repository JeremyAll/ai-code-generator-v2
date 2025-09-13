// Main exports for the Visual Editor package
export { VisualEditor } from './visual-editor';
export { EditorCanvas, useEditorStore } from './editor-core';
export { ComponentsPanel } from './components-panel';
export { PropertiesPanel } from './properties-panel';
export { CodeSync } from './code-sync';

// Types
export interface EditorElement {
  id: string;
  type: string;
  content?: string;
  text?: string;
  src?: string;
  className?: string;
  style?: Record<string, any>;
  children?: EditorElement[];
  [key: string]: any;
}

export interface EditorState {
  elements: EditorElement[];
  selectedId: string | null;
  hoveredId: string | null;
}