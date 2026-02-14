/**
 * Export utilities for SVG and PNG download
 */

/**
 * Extract width and height from SVG string
 * @param svg - The SVG string content
 * @returns Object with width and height, or default values
 */
function getSvgDimensions(svg: string): { width: number; height: number } {
  const widthMatch = svg.match(/width="(\d+)"/);
  const heightMatch = svg.match(/height="(\d+)"/);
  const viewBoxMatch = svg.match(/viewBox="[\d\s]*\s+(\d+)\s+(\d+)"/);
  
  let width = 800; // Default
  let height = 600; // Default
  
  if (widthMatch) {
    width = parseInt(widthMatch[1], 10);
  } else if (viewBoxMatch) {
    width = parseInt(viewBoxMatch[2], 10);
  }
  
  if (heightMatch) {
    height = parseInt(heightMatch[1], 10);
  } else if (viewBoxMatch) {
    height = parseInt(viewBoxMatch[3] || viewBoxMatch[2], 10);
  }
  
  return { width, height };
}

/**
 * Download an SVG string as a file
 * @param svg - The SVG string content
 * @param filename - Optional filename (default: 'diagram.svg')
 */
export function exportSvg(svg: string, filename: string = 'diagram.svg'): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Download an SVG string converted to PNG
 * @param svg - The SVG string content
 * @param filename - Optional filename (default: 'diagram.png')
 */
export function exportPng(svg: string, filename: string = 'diagram.png'): void {
  const { width, height } = getSvgDimensions(svg);
  
  // Create a data URL from the SVG
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  const img = new Image();
  
  img.onload = () => {
    // Create canvas sized to SVG dimensions
    const canvas = document.createElement('canvas');
    canvas.width = img.width || width;
    canvas.height = img.height || height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      URL.revokeObjectURL(svgUrl);
      return;
    }
    
    // Draw SVG to canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create PNG blob');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(svgUrl);
    }, 'image/png');
  };
  
  img.onerror = () => {
    console.error('Failed to load SVG image');
    URL.revokeObjectURL(svgUrl);
  };
  
  img.src = svgUrl;
}
