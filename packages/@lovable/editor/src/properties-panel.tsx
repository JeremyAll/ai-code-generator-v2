import React from 'react';
import { useEditorStore } from './editor-core';

export function PropertiesPanel() {
  const { selectedId, elements, updateElement } = useEditorStore();
  
  const selectedElement = elements.find(e => e.id === selectedId);
  
  if (!selectedElement) {
    return (
      <div className="properties-panel">
        <p>Select an element to edit properties</p>
      </div>
    );
  }
  
  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      
      <div className="property-group">
        <label>Type</label>
        <input value={selectedElement.type} disabled />
      </div>
      
      {selectedElement.type === 'text' && (
        <>
          <div className="property-group">
            <label>Content</label>
            <textarea
              value={selectedElement.content || ''}
              onChange={(e) => updateElement(selectedId!, { content: e.target.value })}
            />
          </div>
          
          <div className="property-group">
            <label>Font Size</label>
            <input
              type="range"
              min="12"
              max="72"
              value={selectedElement.fontSize || 16}
              onChange={(e) => updateElement(selectedId!, { fontSize: e.target.value })}
            />
          </div>
          
          <div className="property-group">
            <label>Text Color</label>
            <input
              type="color"
              value={selectedElement.color || '#000000'}
              onChange={(e) => updateElement(selectedId!, { color: e.target.value })}
            />
          </div>
        </>
      )}
      
      {selectedElement.type === 'button' && (
        <>
          <div className="property-group">
            <label>Text</label>
            <input
              value={selectedElement.text || ''}
              onChange={(e) => updateElement(selectedId!, { text: e.target.value })}
            />
          </div>
          
          <div className="property-group">
            <label>Style</label>
            <select
              value={selectedElement.variant || 'primary'}
              onChange={(e) => updateElement(selectedId!, { variant: e.target.value })}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>
          
          <div className="property-group">
            <label>Size</label>
            <select
              value={selectedElement.size || 'medium'}
              onChange={(e) => updateElement(selectedId!, { size: e.target.value })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </>
      )}
      
      {selectedElement.type === 'image' && (
        <>
          <div className="property-group">
            <label>Source URL</label>
            <input
              value={selectedElement.src || ''}
              onChange={(e) => updateElement(selectedId!, { src: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="property-group">
            <label>Alt Text</label>
            <input
              value={selectedElement.alt || ''}
              onChange={(e) => updateElement(selectedId!, { alt: e.target.value })}
            />
          </div>
          
          <div className="property-group">
            <label>Width</label>
            <input
              type="number"
              value={parseInt(selectedElement.width) || 200}
              onChange={(e) => updateElement(selectedId!, { width: `${e.target.value}px` })}
            />
          </div>
        </>
      )}
      
      <h3>Layout & Styling</h3>
      
      <div className="property-group">
        <label>Background Color</label>
        <input
          type="color"
          value={selectedElement.backgroundColor || '#ffffff'}
          onChange={(e) => updateElement(selectedId!, { backgroundColor: e.target.value })}
        />
      </div>
      
      <div className="property-group">
        <label>Padding</label>
        <input
          type="number"
          value={parseInt(selectedElement.padding) || 8}
          onChange={(e) => updateElement(selectedId!, { padding: `${e.target.value}px` })}
        />
      </div>
      
      <div className="property-group">
        <label>Margin</label>
        <input
          type="number"
          value={parseInt(selectedElement.margin) || 4}
          onChange={(e) => updateElement(selectedId!, { margin: `${e.target.value}px` })}
        />
      </div>
      
      <div className="property-group">
        <label>Border Radius</label>
        <input
          type="number"
          value={parseInt(selectedElement.borderRadius) || 0}
          onChange={(e) => updateElement(selectedId!, { borderRadius: `${e.target.value}px` })}
        />
      </div>
      
      <div className="property-group">
        <label>Display</label>
        <select
          value={selectedElement.display || 'block'}
          onChange={(e) => updateElement(selectedId!, { display: e.target.value })}
        >
          <option value="block">Block</option>
          <option value="inline-block">Inline Block</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
          <option value="none">Hidden</option>
        </select>
      </div>
      
      <h3>Animations</h3>
      <div className="property-group">
        <label>
          <input
            type="checkbox"
            checked={selectedElement.animate || false}
            onChange={(e) => updateElement(selectedId!, { animate: e.target.checked })}
          />
          Enable animations
        </label>
      </div>
      
      {selectedElement.animate && (
        <>
          <div className="property-group">
            <label>Animation Type</label>
            <select
              value={selectedElement.animationType || 'fade'}
              onChange={(e) => updateElement(selectedId!, { animationType: e.target.value })}
            >
              <option value="fade">Fade In</option>
              <option value="slide">Slide Up</option>
              <option value="scale">Scale</option>
              <option value="rotate">Rotate</option>
              <option value="bounce">Bounce</option>
            </select>
          </div>
          
          <div className="property-group">
            <label>Duration (ms)</label>
            <input
              type="number"
              value={selectedElement.animationDuration || 300}
              onChange={(e) => updateElement(selectedId!, { animationDuration: parseInt(e.target.value) })}
              min="100"
              max="2000"
              step="100"
            />
          </div>
        </>
      )}
      
      <h3>Advanced</h3>
      <div className="property-group">
        <label>Custom CSS Class</label>
        <input
          value={selectedElement.className || ''}
          onChange={(e) => updateElement(selectedId!, { className: e.target.value })}
          placeholder="custom-class"
        />
      </div>
    </div>
  );
}