import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useEditorStore } from './editor-core';

const COMPONENTS = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'button', label: 'Button', icon: 'B' },
  { type: 'image', label: 'Image', icon: '🖼' },
  { type: 'container', label: 'Container', icon: '□' },
  { type: 'form', label: 'Form', icon: '📝' },
  { type: 'card', label: 'Card', icon: '▭' },
  { type: 'hero', label: 'Hero Section', icon: '⬜' },
  { type: 'navbar', label: 'Navigation', icon: '☰' }
];

export function ComponentsPanel() {
  const { addElement } = useEditorStore();
  
  return (
    <div className="components-panel">
      <h3>Components</h3>
      <div className="components-grid">
        {COMPONENTS.map((component) => (
          <DraggableComponent
            key={component.type}
            component={component}
            onAdd={() => addElement({ type: component.type })}
          />
        ))}
      </div>
      
      <h3>Templates</h3>
      <div className="templates-list">
        <button onClick={() => addHeroTemplate()}>
          + Hero Section
        </button>
        <button onClick={() => addContactForm()}>
          + Contact Form
        </button>
        <button onClick={() => addPricingCards()}>
          + Pricing Cards
        </button>
      </div>
    </div>
  );
  
  function addHeroTemplate() {
    addElement({
      type: 'container',
      className: 'hero-section',
      children: [
        { type: 'text', content: 'Welcome to Our Site', tag: 'h1' },
        { type: 'text', content: 'Build amazing things', tag: 'p' },
        { type: 'button', text: 'Get Started' }
      ]
    });
  }
  
  function addContactForm() {
    addElement({
      type: 'form',
      children: [
        { type: 'input', placeholder: 'Name' },
        { type: 'input', placeholder: 'Email', inputType: 'email' },
        { type: 'textarea', placeholder: 'Message' },
        { type: 'button', text: 'Send', buttonType: 'submit' }
      ]
    });
  }
  
  function addPricingCards() {
    addElement({
      type: 'container',
      className: 'pricing-section',
      children: [
        {
          type: 'card',
          title: 'Basic',
          price: '$9/month',
          features: ['Feature 1', 'Feature 2', 'Feature 3']
        },
        {
          type: 'card',
          title: 'Pro',
          price: '$29/month',
          features: ['All Basic features', 'Feature 4', 'Feature 5', 'Feature 6']
        },
        {
          type: 'card',
          title: 'Enterprise',
          price: 'Contact us',
          features: ['All Pro features', 'Custom integration', 'Priority support']
        }
      ]
    });
  }
}

function DraggableComponent({ component, onAdd }: any) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${component.type}`
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="component-item"
      onClick={onAdd}
    >
      <span className="component-icon">{component.icon}</span>
      <span className="component-label">{component.label}</span>
    </div>
  );
}