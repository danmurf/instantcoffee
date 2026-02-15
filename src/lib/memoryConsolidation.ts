/**
 * Memory Consolidation
 *
 * Uses Ollama to consolidate, deduplicate, and clean up memories.
 */

import type { Memory } from '../types/memory';
import { DEFAULT_MODEL } from './ollama';

const CONSOLIDATION_PROMPT = `You are a memory consolidation assistant. Consolidate memories by:
1. Removing duplicates
2. Keeping the LATEST version when there are contradictions (memories are in chronological order)
3. Keeping each fact atomic and separate
4. Removing trivial information

Return ONLY a valid JSON array of strings. Example: ["fact 1", "fact 2", "fact 3"]`;

interface ConsolidationResponse {
  memories: string[];
}

export async function consolidateMemories(
  currentMemories: Memory[],
  addMemory: (content: string) => Promise<void>,
  removeMemory: (id: number) => Promise<void>
): Promise<void> {
  console.log('Starting consolidation with', currentMemories.length, 'memories');

  if (currentMemories.length === 0) {
    console.log('No memories to consolidate');
    return;
  }

  // Sort memories by creation time (oldest first) for processing
  const sortedMemories = [...currentMemories].sort((a, b) => a.createdAt - b.createdAt);

  // Create the prompt with all current memories (oldest first)
  const memoriesText = sortedMemories
    .map((m) => m.content)
    .join('\n- ');

  const userPrompt = `Consolidate these ${sortedMemories.length} memories (oldest to newest). Remove duplicates, keep latest info for contradictions:\n\n- ${memoriesText}\n\nReturn valid JSON array only:`;

  console.log('Sending request to Ollama...');

  try {
    // Call Ollama API with timeout (2 minutes for large batches)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: CONSOLIDATION_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent output
          num_ctx: 8192, // Increase context window
          num_predict: 4096, // Limit response length
        }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error response:', errorText);
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Ollama response:', data);

    const content = data.message?.content || '';
    console.log('Response content:', content);

    // Parse the JSON array from the response
    let consolidatedMemories: string[] = [];

    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('Found JSON array in response');
        consolidatedMemories = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, try parsing the whole content
        console.log('Trying to parse entire content as JSON');
        consolidatedMemories = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse consolidation response:', content);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse consolidation response from AI. The AI may not have returned valid JSON.');
    }

    console.log('Parsed memories:', consolidatedMemories);

    // Validate we got an array of strings
    if (!Array.isArray(consolidatedMemories) || consolidatedMemories.length === 0) {
      console.error('Invalid format - not an array or empty:', consolidatedMemories);
      throw new Error('Invalid consolidation response format - expected non-empty array');
    }

    console.log('Deleting', currentMemories.length, 'old memories...');
    // Delete all existing memories
    for (const memory of currentMemories) {
      if (memory.id !== undefined) {
        await removeMemory(memory.id);
      }
    }

    console.log('Adding', consolidatedMemories.length, 'new consolidated memories...');
    // Add consolidated memories
    for (const content of consolidatedMemories) {
      if (content && typeof content === 'string' && content.trim()) {
        await addMemory(content.trim());
      }
    }

    console.log('Consolidation complete!');

  } catch (error) {
    console.error('Consolidation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 2 minutes. This usually means Ollama is taking too long to process your memories. Try:\n1. Check if Ollama is running (ollama serve)\n2. Use a faster model\n3. Reduce the number of memories before consolidating');
      }
      throw error;
    }
    throw error;
  }
}
