import React, { useState } from 'react';
import { EditorCanvas, useEditorStore } from './editor-core';
import { ComponentsPanel } from './components-panel';
import { PropertiesPanel } from './properties-panel';
import { CodeSync } from './code-sync';

export function VisualEditor() {
  const [viewMode, setViewMode] = useState<'visual' | 'code' | 'split'>('visual');
  const [generatedCode, setGeneratedCode] = useState('');
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
    store.elements.length = 0;
    store.selectedId = null;
    setGeneratedCode('');
  };
  
  const handleSave = () => {
    const projectData = {
      elements: store.elements,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    localStorage.setItem('editor-project', JSON.stringify(projectData));
    alert('Project saved successfully!');
  };
  
  const handleLoad = () => {
    const saved = localStorage.getItem('editor-project');
    if (saved) {
      try {
        const projectData = JSON.parse(saved);
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        height: '60px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        background: 'white'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Visual Editor</h2>
          <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '12px' }}>
            {store.elements.length} elements
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'visual' ? 'white' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setViewMode('visual')}
          >
            📐 Visual
          </button>
          <button 
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'code' ? 'white' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setViewMode('code')}
          >
            💻 Code
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleLoad} style={{ 
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            background: 'white'
          }}>
            Load
          </button>
          <button onClick={handleClear} style={{ 
            padding: '8px 16px',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            cursor: 'pointer',
            background: '#ef4444',
            color: 'white'
          }}>
            Clear
          </button>
          <button onClick={handleExport} style={{ 
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            background: 'white'
          }}>
            📤 Export
          </button>
          <button onClick={handleSave} style={{ 
            padding: '8px 16px',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            cursor: 'pointer',
            background: '#3b82f6',
            color: 'white'
          }}>
            💾 Save
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ 
          width: '260px',
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto',
          padding: '20px',
          background: '#fafafa'
        }}>
          <ComponentsPanel />
        </div>
        
        <div style={{ 
          flex: 1,
          background: '#f9fafb',
          overflow: 'auto',
          position: 'relative'
        }}>
          {viewMode === 'visual' && (
            <div style={{ minHeight: '100%', padding: '24px' }}>
              <EditorCanvas />
            </div>
          )}
          
          {viewMode === 'code' && (
            <div style={{ 
              background: '#1e1e1e',
              color: '#d4d4d4',
              fontFamily: "'Monaco', 'Menlo', monospace"
            }}>
              <div style={{
                padding: '12px 16px',
                background: '#2d2d30',
                borderBottom: '1px solid #3e3e42',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Generated React Component</span>
                <button onClick={handleExport} style={{
                  background: '#0e639c',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}>
                  🔄 Refresh
                </button>
              </div>
              <pre style={{ 
                margin: 0,
                padding: '16px',
                overflow: 'auto',
                height: 'calc(100vh - 45px - 60px)'
              }}>
                <code style={{ fontSize: '13px', lineHeight: 1.4 }}>
                  {generatedCode || 'Export to see generated code'}
                </code>
              </pre>
            </div>
          )}
        </div>
        
        <div style={{ 
          width: '300px',
          borderLeft: '1px solid #e5e7eb',
          overflowY: 'auto',
          padding: '20px',
          background: '#fafafa'
        }}>
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}