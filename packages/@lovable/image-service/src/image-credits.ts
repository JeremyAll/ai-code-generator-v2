import { ImageResult } from './unsplash-service';

export interface CreditOptions {
  format?: 'markdown' | 'html' | 'json' | 'txt';
  includeDescription?: boolean;
  includeDownloadLink?: boolean;
  groupBySection?: boolean;
}

export class ImageCredits {
  // Generate credits file in various formats
  generateCreditsFile(
    images: ImageResult[] | Record<string, ImageResult[]>,
    options: CreditOptions = {}
  ): string {
    const {
      format = 'markdown',
      includeDescription = true,
      includeDownloadLink = false,
      groupBySection = false
    } = options;
    
    // Normalize images to flat array if needed
    const imageList = Array.isArray(images) 
      ? images 
      : Object.values(images).flat();
    
    // Remove duplicates by ID
    const uniqueImages = this.removeDuplicateImages(imageList);
    
    switch (format) {
      case 'markdown':
        return this.generateMarkdownCredits(uniqueImages, options);
      case 'html':
        return this.generateHtmlCredits(uniqueImages, options);
      case 'json':
        return this.generateJsonCredits(uniqueImages, options);
      case 'txt':
        return this.generateTextCredits(uniqueImages, options);
      default:
        return this.generateMarkdownCredits(uniqueImages, options);
    }
  }
  
  private generateMarkdownCredits(images: ImageResult[], options: CreditOptions): string {
    let credits = '# Image Credits\n\n';
    credits += 'This project uses beautiful images from Unsplash. Please respect the photographers\' work and the Unsplash license.\n\n';
    
    if (options.groupBySection && !Array.isArray(images)) {
      // Handle grouped images (not implemented in this simplified version)
      credits += '## Images by Section\n\n';
    }
    
    credits += '## Photographers\n\n';
    
    images.forEach((image, index) => {
      credits += `### ${index + 1}. ${image.author}\n`;
      credits += `- **Source**: [View on Unsplash](${image.authorUrl})\n`;
      
      if (options.includeDescription && image.description) {
        credits += `- **Description**: ${image.description}\n`;
      }
      
      if (options.includeDownloadLink && image.downloadUrl) {
        credits += `- **Download**: [High Resolution](${image.downloadUrl})\n`;
      }
      
      credits += `- **Image ID**: ${image.id}\n\n`;
    });
    
    credits += '---\n\n';
    credits += '## License Information\n\n';
    credits += 'All images are provided under the [Unsplash License](https://unsplash.com/license):\n\n';
    credits += '- ✅ Free to use for any purpose\n';
    credits += '- ✅ No permission needed\n';
    credits += '- ✅ Commercial and non-commercial use\n';
    credits += '- ❗ Cannot be sold as a standalone digital product\n';
    credits += '- ❗ Cannot be used to compete with Unsplash\n\n';
    credits += `Generated on ${new Date().toLocaleDateString()}\n`;
    
    return credits;
  }
  
  private generateHtmlCredits(images: ImageResult[], options: CreditOptions): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Credits</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .credit-item { margin-bottom: 20px; padding: 15px; border-left: 4px solid #007acc; background: #f8f9fa; }
        .photographer-name { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .image-info { margin: 5px 0; }
        .license-info { background: #e7f3ff; padding: 20px; border-radius: 8px; margin-top: 30px; }
        a { color: #007acc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Image Credits</h1>
    <p>This project uses beautiful images from Unsplash. Please respect the photographers' work and the Unsplash license.</p>
`;
    
    images.forEach((image, index) => {
      html += `    <div class="credit-item">
        <div class="photographer-name">${index + 1}. ${this.escapeHtml(image.author)}</div>
        <div class="image-info"><strong>Source:</strong> <a href="${image.authorUrl}" target="_blank">View on Unsplash</a></div>`;
      
      if (options.includeDescription && image.description) {
        html += `        <div class="image-info"><strong>Description:</strong> ${this.escapeHtml(image.description)}</div>`;
      }
      
      if (options.includeDownloadLink && image.downloadUrl) {
        html += `        <div class="image-info"><strong>Download:</strong> <a href="${image.downloadUrl}" target="_blank">High Resolution</a></div>`;
      }
      
      html += `        <div class="image-info"><strong>Image ID:</strong> ${image.id}</div>
    </div>
`;
    });
    
    html += `    <div class="license-info">
        <h2>License Information</h2>
        <p>All images are provided under the <a href="https://unsplash.com/license" target="_blank">Unsplash License</a>:</p>
        <ul>
            <li>✅ Free to use for any purpose</li>
            <li>✅ No permission needed</li>
            <li>✅ Commercial and non-commercial use</li>
            <li>❗ Cannot be sold as a standalone digital product</li>
            <li>❗ Cannot be used to compete with Unsplash</li>
        </ul>
        <p><small>Generated on ${new Date().toLocaleDateString()}</small></p>
    </div>
</body>
</html>`;
    
    return html;
  }
  
  private generateJsonCredits(images: ImageResult[], options: CreditOptions): string {
    const credits = {
      metadata: {
        title: 'Image Credits',
        generatedAt: new Date().toISOString(),
        totalImages: images.length,
        license: 'Unsplash License',
        licenseUrl: 'https://unsplash.com/license'
      },
      images: images.map(image => ({
        id: image.id,
        author: image.author,
        authorUrl: image.authorUrl,
        ...(options.includeDescription && image.description && { description: image.description }),
        ...(options.includeDownloadLink && image.downloadUrl && { downloadUrl: image.downloadUrl }),
        thumbnailUrl: image.thumbnailUrl,
        url: image.url
      }))
    };
    
    return JSON.stringify(credits, null, 2);
  }
  
  private generateTextCredits(images: ImageResult[], options: CreditOptions): string {
    let credits = 'IMAGE CREDITS\n';
    credits += '=============\n\n';
    credits += 'This project uses beautiful images from Unsplash.\n';
    credits += 'Please respect the photographers\' work and the Unsplash license.\n\n';
    
    credits += 'PHOTOGRAPHERS:\n\n';
    
    images.forEach((image, index) => {
      credits += `${index + 1}. ${image.author}\n`;
      credits += `   Source: ${image.authorUrl}\n`;
      
      if (options.includeDescription && image.description) {
        credits += `   Description: ${image.description}\n`;
      }
      
      if (options.includeDownloadLink && image.downloadUrl) {
        credits += `   Download: ${image.downloadUrl}\n`;
      }
      
      credits += `   Image ID: ${image.id}\n\n`;
    });
    
    credits += 'LICENSE INFORMATION:\n';
    credits += 'All images are provided under the Unsplash License.\n';
    credits += 'Visit: https://unsplash.com/license\n\n';
    credits += `Generated on ${new Date().toLocaleDateString()}\n`;
    
    return credits;
  }
  
  // Generate inline credit comment for code
  generateInlineCredit(image: ImageResult, format: 'html' | 'css' | 'jsx' = 'html'): string {
    const credit = `Photo by ${image.author} on Unsplash`;
    
    switch (format) {
      case 'html':
        return `<!-- ${credit} -->`;
      case 'css':
        return `/* ${credit} */`;
      case 'jsx':
        return `{/* ${credit} */}`;
      default:
        return `<!-- ${credit} -->`;
    }
  }
  
  // Generate attribution component for React
  generateAttributionComponent(images: ImageResult[]): string {
    const uniqueImages = this.removeDuplicateImages(images);
    
    return `import React, { useState } from 'react';

const ImageAttribution = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const images = ${JSON.stringify(uniqueImages.map(img => ({
    id: img.id,
    author: img.author,
    authorUrl: img.authorUrl
  })), null, 4)};
  
  return (
    <div className="image-attribution">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="attribution-toggle"
        aria-label="View image credits"
      >
        📸 Image Credits
      </button>
      
      {isOpen && (
        <div className="attribution-modal">
          <div className="attribution-content">
            <h3>Image Credits</h3>
            <p>Beautiful images provided by these talented photographers:</p>
            <ul>
              {images.map((image, index) => (
                <li key={image.id}>
                  <a href={image.authorUrl} target="_blank" rel="noopener noreferrer">
                    {image.author}
                  </a>
                </li>
              ))}
            </ul>
            <p>
              <small>
                All images from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
              </small>
            </p>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAttribution;`;
  }
  
  // Generate footer attribution text
  generateFooterAttribution(images: ImageResult[]): string {
    const uniqueImages = this.removeDuplicateImages(images);
    const authorNames = uniqueImages.map(img => img.author).slice(0, 3);
    
    if (authorNames.length === 0) {
      return 'Images from Unsplash';
    }
    
    if (authorNames.length === 1) {
      return `Photo by ${authorNames[0]} on Unsplash`;
    }
    
    if (authorNames.length <= 3) {
      return `Photos by ${authorNames.join(', ')} on Unsplash`;
    }
    
    return `Photos by ${authorNames.slice(0, 2).join(', ')} and ${uniqueImages.length - 2} others on Unsplash`;
  }
  
  // Utility methods
  private removeDuplicateImages(images: ImageResult[]): ImageResult[] {
    const seen = new Set();
    return images.filter(image => {
      if (seen.has(image.id)) {
        return false;
      }
      seen.add(image.id);
      return true;
    });
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Generate CREDITS.md file content
  generateCreditsMarkdown(imagesBySection: Record<string, ImageResult[]>): string {
    let markdown = '# Image Credits\n\n';
    markdown += 'This project uses high-quality images from [Unsplash](https://unsplash.com).\n\n';
    
    // Credits by section
    Object.entries(imagesBySection).forEach(([section, images]) => {
      if (images.length > 0) {
        markdown += `## ${section.charAt(0).toUpperCase() + section.slice(1)} Images\n\n`;
        
        images.forEach((image, index) => {
          markdown += `- **${image.author}** - [View on Unsplash](${image.authorUrl})\n`;
          if (image.description) {
            markdown += `  - ${image.description}\n`;
          }
        });
        
        markdown += '\n';
      }
    });
    
    markdown += '## License\n\n';
    markdown += 'All images are used under the [Unsplash License](https://unsplash.com/license).\n';
    
    return markdown;
  }
}