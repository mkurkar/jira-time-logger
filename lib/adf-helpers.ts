import type { ADFDocument, ADFNode } from '@/src/types/jira';

/**
 * Wrap plain text into an ADF document for Jira v3 API.
 */
export function textToADF(text: string): ADFDocument {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
    ],
  };
}

/**
 * Extract plain text from an ADF document.
 * Recursively walks the node tree and concatenates text nodes.
 */
export function adfToText(doc: ADFDocument | undefined | null): string {
  if (!doc || !doc.content) return '';

  function extractText(nodes: ADFNode[]): string {
    return nodes
      .map((node) => {
        if (node.type === 'text' && node.text) return node.text;
        if (node.content) return extractText(node.content);
        return '';
      })
      .join('');
  }

  return extractText(doc.content);
}
