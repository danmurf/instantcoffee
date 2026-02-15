/**
 * D2 Rendering Client
 * 
 * Provides client-side interface to the Express backend's D2 rendering API.
 */

export interface RenderResponse {
  svg: string;
}

export interface RenderError {
  error: string;
}

/**
 * Renders D2 source code to an SVG diagram
 * @param d2Source - The D2 diagram source code
 * @returns Promise resolving to the SVG string
 * @throws Error if rendering fails
 */
export async function renderD2(d2Source: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ d2Source }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData: RenderError = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to render diagram`);
    }
    
    const data: RenderResponse = await response.json();
    return data.svg;
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Rendering timed out. The diagram may be too complex.');
      }
      throw err;
    }
    throw new Error('Unknown error during D2 rendering');
  }
}
