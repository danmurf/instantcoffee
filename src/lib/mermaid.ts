import mermaid from 'mermaid';

let initialized = false;

export function initMermaid(): void {
  if (initialized) return;
  
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'sans-serif',
  });
  
  initialized = true;
}

let renderCounter = 0;

export async function renderMermaid(source: string): Promise<string> {
  const id = `mermaid-${++renderCounter}`;
  
  try {
    const { svg } = await mermaid.render(id, source);
    return svg;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Mermaid syntax error: ${err.message}`);
    }
    throw new Error('Failed to render Mermaid diagram');
  }
}
