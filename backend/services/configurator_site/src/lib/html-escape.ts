/**
 * HTML Escaping Utilities
 * Ensures all user inputs are safely escaped
 */

/**
 * Escape HTML special characters
 * Prevents XSS by escaping <, >, &, ", '
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape HTML in object recursively
 * Escapes all string values in nested objects/arrays
 */
export function escapeHtmlInObject(obj: any): any {
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => escapeHtmlInObject(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const escaped: any = {};
    for (const [key, value] of Object.entries(obj)) {
      escaped[key] = escapeHtmlInObject(value);
    }
    return escaped;
  }
  
  return obj;
}

/**
 * Validate that string contains no script tags or event handlers
 */
export function containsUnsafeContent(str: string): boolean {
  const unsafe = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
  ];
  
  return unsafe.some(pattern => pattern.test(str));
}

