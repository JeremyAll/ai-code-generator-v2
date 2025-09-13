export class CodeSync {
  private store: any;
  
  constructor(store: any) {
    this.store = store;
  }
  
  // Convertit les éléments visuels en code React
  elementsToReact(elements: any[]): string {
    const imports = new Set(['import React from "react";']);
    let componentCode = 'export default function GeneratedComponent() {\n  return (\n    <div className="generated-component">\n';
    
    elements.forEach(element => {
      componentCode += this.elementToJSX(element, 6);
    });
    
    componentCode += '    </div>\n  );\n}';
    
    return Array.from(imports).join('\n') + '\n\n' + componentCode;
  }
  
  // Génère le CSS pour les éléments
  elementsToCSS(elements: any[]): string {
    let css = '.generated-component {\n  min-height: 100vh;\n  padding: 20px;\n}\n\n';
    
    elements.forEach(element => {
      css += this.elementToCSS(element);
    });
    
    // Add common styles
    css += `
.text-element {
  margin: 8px 0;
}

.button-element {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.button-element.primary {
  background: #3b82f6;
  color: white;
}

.button-element.secondary {
  background: #6b7280;
  color: white;
}

.button-element.outline {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.container-element {
  padding: 16px;
  border: 1px dashed #d1d5db;
  min-height: 50px;
}

.hero-section {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pricing-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 40px 20px;
}
`;
    
    return css;
  }
  
  private elementToJSX(element: any, indent: number): string {
    const spaces = ' '.repeat(indent);
    const style = this.buildInlineStyles(element);
    const styleAttr = Object.keys(style).length > 0 ? ` style={${JSON.stringify(style)}}` : '';
    const className = element.className ? ` className="${element.className}"` : '';
    
    switch (element.type) {
      case 'text':
        const tag = element.tag || 'p';
        return `${spaces}<${tag}${className}${styleAttr}>${element.content || 'Edit text'}</${tag}>\n`;
      
      case 'button':
        const variant = element.variant ? ` ${element.variant}` : '';
        return `${spaces}<button className="button-element${variant}"${styleAttr}>${element.text || 'Button'}</button>\n`;
      
      case 'image':
        const alt = element.alt ? ` alt="${element.alt}"` : ' alt=""';
        const src = element.src || '/placeholder.png';
        return `${spaces}<img src="${src}"${alt}${styleAttr} />\n`;
      
      case 'container':
        let jsx = `${spaces}<div className="container-element${element.className ? ' ' + element.className : ''}"${styleAttr}>\n`;
        if (element.children && Array.isArray(element.children)) {
          element.children.forEach((child: any) => {
            jsx += this.elementToJSX(child, indent + 2);
          });
        }
        jsx += `${spaces}</div>\n`;
        return jsx;
      
      case 'form':
        let formJsx = `${spaces}<form${className}${styleAttr}>\n`;
        if (element.children && Array.isArray(element.children)) {
          element.children.forEach((child: any) => {
            formJsx += this.elementToJSX(child, indent + 2);
          });
        }
        formJsx += `${spaces}</form>\n`;
        return formJsx;
      
      case 'input':
        const inputType = element.inputType || 'text';
        const placeholder = element.placeholder ? ` placeholder="${element.placeholder}"` : '';
        return `${spaces}<input type="${inputType}"${placeholder}${styleAttr} />\n`;
      
      case 'textarea':
        const textareaPlaceholder = element.placeholder ? ` placeholder="${element.placeholder}"` : '';
        return `${spaces}<textarea${textareaPlaceholder}${styleAttr}></textarea>\n`;
      
      case 'card':
        let cardJsx = `${spaces}<div className="card"${styleAttr}>\n`;
        if (element.title) {
          cardJsx += `${spaces}  <h3>${element.title}</h3>\n`;
        }
        if (element.price) {
          cardJsx += `${spaces}  <div className="price">${element.price}</div>\n`;
        }
        if (element.features && Array.isArray(element.features)) {
          cardJsx += `${spaces}  <ul>\n`;
          element.features.forEach((feature: string) => {
            cardJsx += `${spaces}    <li>${feature}</li>\n`;
          });
          cardJsx += `${spaces}  </ul>\n`;
        }
        cardJsx += `${spaces}</div>\n`;
        return cardJsx;
      
      default:
        return `${spaces}<div${className}${styleAttr}><!-- ${element.type} --></div>\n`;
    }
  }
  
  private elementToCSS(element: any): string {
    if (!element.id) return '';
    
    let css = `#${element.id} {\n`;
    
    if (element.fontSize) css += `  font-size: ${element.fontSize}px;\n`;
    if (element.color) css += `  color: ${element.color};\n`;
    if (element.backgroundColor) css += `  background-color: ${element.backgroundColor};\n`;
    if (element.padding) css += `  padding: ${element.padding};\n`;
    if (element.margin) css += `  margin: ${element.margin};\n`;
    if (element.borderRadius) css += `  border-radius: ${element.borderRadius};\n`;
    if (element.width) css += `  width: ${element.width};\n`;
    if (element.height) css += `  height: ${element.height};\n`;
    if (element.display) css += `  display: ${element.display};\n`;
    
    // Animation styles
    if (element.animate && element.animationType) {
      css += `  animation: ${element.animationType} ${element.animationDuration || 300}ms ease-out;\n`;
    }
    
    css += '}\n\n';
    
    return css;
  }
  
  private buildInlineStyles(element: any): any {
    const style: any = {};
    
    if (element.fontSize) style.fontSize = `${element.fontSize}px`;
    if (element.color) style.color = element.color;
    if (element.backgroundColor) style.backgroundColor = element.backgroundColor;
    if (element.padding) style.padding = element.padding;
    if (element.margin) style.margin = element.margin;
    if (element.borderRadius) style.borderRadius = element.borderRadius;
    if (element.width) style.width = element.width;
    if (element.height) style.height = element.height;
    if (element.display) style.display = element.display;
    
    return style;
  }
  
  // Parse du code React vers éléments visuels (simplifié)
  reactToElements(code: string): any[] {
    // Simple parser (à améliorer avec un vrai parser AST)
    const elements = [];
    
    // Regex pour extraire les éléments JSX basiques
    const jsxRegex = /<(\w+)([^>]*?)(?:\/>|>(.*?)<\/\1>)/gs;
    let match;
    
    while ((match = jsxRegex.exec(code)) !== null) {
      const [, tag, attrs, content] = match;
      
      elements.push({
        id: `parsed-${Date.now()}-${Math.random()}`,
        type: this.tagToType(tag),
        content: content ? content.trim() : undefined,
        ...this.parseAttributes(attrs)
      });
    }
    
    return elements;
  }
  
  private tagToType(tag: string): string {
    const mapping: Record<string, string> = {
      'p': 'text',
      'h1': 'text',
      'h2': 'text',
      'h3': 'text',
      'span': 'text',
      'button': 'button',
      'img': 'image',
      'div': 'container',
      'form': 'form',
      'input': 'input',
      'textarea': 'textarea'
    };
    return mapping[tag] || 'container';
  }
  
  private parseAttributes(attrs: string): any {
    const result: any = {};
    
    // Simple attribute parsing
    const attrRegex = /(\w+)=["']([^"']*?)["']/g;
    let match;
    
    while ((match = attrRegex.exec(attrs)) !== null) {
      const [, name, value] = match;
      
      switch (name) {
        case 'className':
          result.className = value;
          break;
        case 'src':
          result.src = value;
          break;
        case 'alt':
          result.alt = value;
          break;
        case 'placeholder':
          result.placeholder = value;
          break;
        case 'type':
          if (this.tagToType('input') === 'input') {
            result.inputType = value;
          }
          break;
      }
    }
    
    return result;
  }
  
  // Export complete project with HTML + CSS + JS
  exportProject(elements: any[], projectName: string = 'generated-project'): { 
    html: string, 
    css: string, 
    js: string 
  } {
    const reactCode = this.elementsToReact(elements);
    const css = this.elementsToCSS(elements);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" src="app.js"></script>
</body>
</html>`;
    
    const js = `${reactCode}

ReactDOM.render(React.createElement(GeneratedComponent), document.getElementById('root'));`;
    
    return { html, css, js };
  }
}