/**
 * Export utilities for SVG and PNG download
 */

import { toPng } from 'html-to-image';

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
export async function exportPng(svg: string, filename: string = 'diagram.png'): Promise<void> {
  // Create a container with the SVG
  const container = document.createElement('div');
  container.innerHTML = svg;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  
  const svgElement = container.querySelector('svg');
  if (!svgElement) {
    console.error('No SVG element found');
    document.body.removeChild(container);
    return;
  }
  
  try {
    const dataUrl = await toPng(svgElement as unknown as HTMLElement, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to export PNG:', err);
  } finally {
    document.body.removeChild(container);
  }
}
