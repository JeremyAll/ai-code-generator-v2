import React, { useState } from 'react';
import { EditorCanvas, useEditorStore } from './editor-core';
import { ComponentsPanel } from './components-panel';
import { PropertiesPanel } from './properties-panel';
import { CodeSync } from './code-sync';

export function VisualEditor({ initialCode }: { initialCode?: string }) {
  const [viewMode, setViewMode] = useState<'visual' | 'code' | 'split'>('visual');
  const [generatedCode, setGeneratedCode] = useState(initialCode || '');
  const [showPreview, setShowPreview] = useState(false);
  const store = useEditorStore();
  const codeSync = new CodeSync(store);
  
  const handleExport = () => {
    const code = codeSync.elementsToReact(store.elements);
    const css = codeSync.elementsToCSS(store.elements);
    setGeneratedCode(code);
    console.log('Generated Code:', code);
    console.log('Generated CSS:', css);
    
    // Emit event for parent
    window.dispatchEvent(new CustomEvent('editor-export', { 
      detail: { code, css, elements: store.elements } 
    }));
  };
  
  const handleClear = () => {
    // Clear all elements using zustand's direct state mutation
    store.elements.length = 0;
    store.selectedId = null;
    setGeneratedCode('');
  };
  
  const handlePreview = () => {
    if (!showPreview) {
      handleExport(); // Generate code first
    }
    setShowPreview(!showPreview);
  };
  
  const handleSave = () => {
    const projectData = {
      elements: store.elements,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Save to localStorage for now
    localStorage.setItem('editor-project', JSON.stringify(projectData));
    alert('Project saved successfully!');
  };
  
  const handleLoad = () => {
    const saved = localStorage.getItem('editor-project');
    if (saved) {
      try {
        const projectData = JSON.parse(saved);
        // Load elements back into store
        store.elements.length = 0;
        store.elements.push(...projectData.elements);
        store.selectedId = null;
        alert('Project loaded successfully!');
      } catch (error) {
        alert('Error loading project');
      }
    } else {
      alert('No saved project found');
    }
  };
  
  return (
    <div className="visual-editor">
      <div className="editor-header">
        <div className="editor-title">
          <h2>Visual Editor</h2>
          <span className="element-count">{store.elements.length} elements</span>
        </div>
        
        <div className="view-switcher">
          <button 
            className={viewMode === 'visual' ? 'active' : ''}
            onClick={() => setViewMode('visual')}
          >
            📐 Visual
          </button>
          <button 
            className={viewMode === 'code' ? 'active' : ''}
            onClick={() => setViewMode('code')}
          >
            💻 Code
          </button>
          <button 
            className={viewMode === 'split' ? 'active' : ''}
            onClick={() => setViewMode('split')}
          >
            📑 Split
          </button>
        </div>
        
        <div className="editor-actions">
          <button onClick={handleLoad} className="secondary">Load</button>
          <button onClick={handleClear} className="danger">Clear</button>
          <button onClick={handlePreview} className={showPreview ? 'active' : ''}>
            {showPreview ? '👁️ Hide Preview' : '👁️ Preview'}
          </button>
          <button onClick={handleExport}>📤 Export</button>
          <button onClick={handleSave} className="primary">💾 Save</button>
        </div>
      </div>
      
      <div className={`editor-body view-${viewMode}`}>
        {!showPreview ? (
          <>
            <div className="left-panel">
              <ComponentsPanel />
            </div>
            
            <div className="center-panel">
              {(viewMode === 'visual' || viewMode === 'split') && (
                <div className="visual-view">
                  <EditorCanvas />
                </div>
              )}
              
              {(viewMode === 'code' || viewMode === 'split') && (
                <div className="code-view">
                  <div className="code-header">
                    <span>Generated React Component</span>
                    <button onClick={handleExport}>🔄 Refresh</button>
                  </div>
                  <pre>
                    <code>{generatedCode || 'Export to see generated code'}</code>
                  </pre>
                </div>
              )}
            </div>
            
            <div className="right-panel">
              <PropertiesPanel />
            </div>
          </>
        ) : (
          <div className="preview-panel">
            <div className="preview-header">
              <h3>Live Preview</h3>
              <button onClick={() => setShowPreview(false)}>← Back to Editor</button>
            </div>
            <div className="preview-content">
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        ${codeSync.elementsToCSS(store.elements)}
                        body { margin: 0; font-family: Arial, sans-serif; }
                      </style>
                    </head>
                    <body>
                      <div id="preview">
                        ${renderPreviewHTML()}
                      </div>
                    </body>
                  </html>
                `}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .visual-editor {
          height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .editor-header {
          height: 60px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .editor-title h2 {
          margin: 0;
          color: #1f2937;
        }
        
        .element-count {
          color: #6b7280;
          font-size: 14px;
          margin-left: 12px;
        }
        
        .view-switcher {
          display: flex;
          gap: 4px;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 8px;
        }
        
        .view-switcher button {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .view-switcher button.active {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .editor-actions {
          display: flex;
          gap: 8px;
        }
        
        .editor-actions button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
        }
        
        .editor-actions button.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .editor-actions button.secondary {
          background: #6b7280;
          color: white;
          border-color: #6b7280;
        }
        
        .editor-actions button.danger {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }
        
        .editor-actions button.active {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }
        
        .editor-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .left-panel {
          width: 260px;
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
          padding: 20px;
          background: #fafafa;
        }
        
        .center-panel {
          flex: 1;
          background: #f9fafb;
          overflow: auto;
          position: relative;
        }
        
        .right-panel {
          width: 300px;
          border-left: 1px solid #e5e7eb;
          overflow-y: auto;
          padding: 20px;
          background: #fafafa;
        }
        
        .view-split .center-panel {
          display: grid;
          grid-template-rows: 1fr 1fr;
        }
        
        .visual-view {
          min-height: 100%;
          padding: 24px;
        }
        
        .code-view {
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .code-header {
          padding: 12px 16px;
          background: #2d2d30;
          border-bottom: 1px solid #3e3e42;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .code-header button {
          background: #0e639c;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .code-view pre {
          margin: 0;
          padding: 16px;
          overflow: auto;
          height: calc(100% - 45px);
        }
        
        .code-view code {
          font-size: 13px;
          line-height: 1.4;
        }
        
        .preview-panel {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .preview-header {
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .preview-header h3 {
          margin: 0;
          color: #1f2937;
        }
        
        .preview-header button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        
        .preview-content {
          flex: 1;
          background: white;
        }
        
        /* Component Panel Styles */
        .components-panel h3 {
          margin: 0 0 16px 0;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
        }
        
        .components-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .component-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        
        .component-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }
        
        .component-icon {
          font-size: 20px;
          margin-bottom: 4px;
        }
        
        .component-label {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        
        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .templates-list button {
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-size: 13px;
        }
        
        .templates-list button:hover {
          border-color: #3b82f6;
          background: #f8faff;
        }
        
        /* Properties Panel Styles */
        .properties-panel h3 {
          margin: 0 0 16px 0;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        
        .property-group {
          margin-bottom: 16px;
        }
        
        .property-group label {
          display: block;
          margin-bottom: 6px;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
        }
        
        .property-group input,
        .property-group select,
        .property-group textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
          background: white;
        }
        
        .property-group input[type="color"] {
          height: 36px;
          padding: 2px;
        }
        
        .property-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }
        
        .property-group textarea {
          resize: vertical;
          min-height: 60px;
        }
        
        /* Canvas Styles */
        .canvas-container {
          min-height: 100%;
          padding: 24px;
          background: white;
          border-radius: 8px;
          margin: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
        }
        
        .empty-state p {
          margin: 0;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

// Helper function to render preview HTML
function renderPreviewHTML() {
    const store = useEditorStore.getState();
    let html = '';
    
    store.elements.forEach(element => {
      html += elementToHTML(element);
    });
    
    return html;
}
  
function elementToHTML(element: any): string {
    switch (element.type) {
      case 'text':
        return `<p style="font-size: ${element.fontSize || 16}px; color: ${element.color || '#000'}">${element.content || 'Edit text'}</p>`;
      case 'button':
        return `<button style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px;">${element.text || 'Button'}</button>`;
      case 'image':
        return `<img src="${element.src || '/placeholder.png'}" alt="${element.alt || ''}" style="max-width: 100%;" />`;
      default:
        return `<div><!-- ${element.type} --></div>`;
    }
}