/**
 * Strips markdown code fences from Claude responses and parses JSON.
 * Handles: ```json ... ```, ``` ... ```, BOM, \r\n, leading/trailing text,
 * and unescaped newlines/tabs inside string values.
 */
export function parseClaudeJSON(raw: string): unknown {
  // Normalize: remove BOM, normalize line endings
  let text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n').trim();

  // Strip markdown code fences at start and end (any variant)
  text = text.replace(/^```(?:json)?[ \t]*\n?/i, '').replace(/\n?```[ \t]*$/i, '').trim();

  // Extract the first JSON object or array, ignoring surrounding prose
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) text = match[1];

  try {
    return JSON.parse(text);
  } catch {
    // Fix unescaped control characters inside JSON string values
    let inString = false;
    let escaped = false;
    let result = '';
    for (const ch of text) {
      if (escaped) { result += ch; escaped = false; continue; }
      if (ch === '\\' && inString) { result += ch; escaped = true; continue; }
      if (ch === '"') { result += ch; inString = !inString; continue; }
      if (inString && ch === '\n') { result += '\\n'; continue; }
      if (inString && ch === '\r') continue;
      if (inString && ch === '\t') { result += '\\t'; continue; }
      result += ch;
    }
    return JSON.parse(result);
  }
}
