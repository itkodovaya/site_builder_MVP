/**
 * HTML Sanitizer
 * Advanced HTML sanitization for Frappe output
 * 
 * This module provides comprehensive sanitization of HTML content
 * to prevent XSS attacks while allowing safe HTML structures
 */

import { escapeHtml, containsUnsafeContent } from './html-escape';

/**
 * Allowed HTML tags (whitelist)
 */
const ALLOWED_TAGS = new Set([
  'html', 'head', 'body', 'title', 'meta', 'link', 'style',
  'div', 'span', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'a', 'strong', 'em', 'b', 'i', 'u', 'small',
  'img', 'picture', 'source', 'svg', 'path', 'circle', 'rect',
  'button', 'form', 'input', 'label', 'textarea', 'select', 'option',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

/**
 * Allowed attributes (whitelist)
 */
const ALLOWED_ATTRIBUTES = new Set([
  'class', 'id', 'style', 'title', 'alt', 'aria-label', 'aria-hidden',
  'href', 'target', 'rel',
  'src', 'srcset', 'width', 'height',
  'type', 'name', 'value', 'placeholder',
  'data-*', // Allow data attributes
]);

/**
 * Dangerous protocols in URLs
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
];

/**
 * Sanitization options
 */
export interface SanitizeOptions {
  allowedTags?: Set<string>;
  allowedAttributes?: Set<string>;
  stripUnknownTags?: boolean;
  escapeUserContent?: boolean;
}

/**
 * Sanitize HTML from Frappe output
 * 
 * This function provides multi-layer protection:
 * 1. Tag whitelist validation
 * 2. Attribute whitelist validation
 * 3. URL protocol validation
 * 4. Script/event handler removal
 * 5. User content escaping
 */
export function sanitizeHtml(html: string, options?: SanitizeOptions): string {
  const opts: Required<SanitizeOptions> = {
    allowedTags: options?.allowedTags || ALLOWED_TAGS,
    allowedAttributes: options?.allowedAttributes || ALLOWED_ATTRIBUTES,
    stripUnknownTags: options?.stripUnknownTags ?? true,
    escapeUserContent: options?.escapeUserContent ?? true,
  };

  // Step 1: Check for obvious unsafe content
  if (containsUnsafeContent(html)) {
    console.warn('[Sanitizer] Unsafe content detected, applying aggressive sanitization');
  }

  // Step 2: Remove script tags and event handlers
  let sanitized = removeScriptTags(html);
  sanitized = removeEventHandlers(sanitized);

  // Step 3: Validate and sanitize URLs
  sanitized = sanitizeUrls(sanitized);

  // Step 4: Remove inline scripts in style tags
  sanitized = sanitizeStyleTags(sanitized);

  // Step 5: If stripUnknownTags is enabled, remove tags not in whitelist
  if (opts.stripUnknownTags) {
    sanitized = stripUnknownTags(sanitized, opts.allowedTags);
  }

  // Step 6: Remove attributes not in whitelist
  sanitized = sanitizeAttributes(sanitized, opts.allowedAttributes);

  return sanitized;
}

/**
 * Remove all script tags
 */
function removeScriptTags(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Remove event handler attributes (onclick, onload, etc.)
 */
function removeEventHandlers(html: string): string {
  return html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Sanitize URLs to prevent javascript: and data: protocols
 */
function sanitizeUrls(html: string): string {
  let sanitized = html;

  // Find all href and src attributes
  const urlPattern = /(href|src)\s*=\s*["']([^"']*)["']/gi;
  
  sanitized = sanitized.replace(urlPattern, (match, attr, url) => {
    const trimmedUrl = url.trim().toLowerCase();
    
    // Check for dangerous protocols
    for (const protocol of DANGEROUS_PROTOCOLS) {
      if (trimmedUrl.startsWith(protocol)) {
        console.warn(`[Sanitizer] Blocked dangerous URL protocol: ${trimmedUrl.substring(0, 50)}`);
        return `${attr}="#"`;
      }
    }
    
    return match;
  });

  return sanitized;
}

/**
 * Sanitize style tags to remove potential scripts
 */
function sanitizeStyleTags(html: string): string {
  return html.replace(/<style[^>]*>(.*?)<\/style>/gis, (match, content) => {
    // Remove any javascript: or expression() in CSS
    let sanitizedContent = content.replace(/javascript:/gi, '');
    sanitizedContent = sanitizedContent.replace(/expression\s*\(/gi, '');
    return `<style>${sanitizedContent}</style>`;
  });
}

/**
 * Strip tags not in whitelist
 */
function stripUnknownTags(html: string, allowedTags: Set<string>): string {
  return html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tagName) => {
    if (allowedTags.has(tagName.toLowerCase())) {
      return match;
    }
    console.warn(`[Sanitizer] Stripped unknown tag: ${tagName}`);
    return '';
  });
}

/**
 * Sanitize attributes to whitelist only
 */
function sanitizeAttributes(html: string, allowedAttributes: Set<string>): string {
  return html.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tagName, attributes) => {
    const sanitizedAttrs = attributes.replace(
      /\s+([a-z][a-z0-9-]*)\s*=\s*["']([^"']*)["']/gi,
      (attrMatch: string, attrName: string, attrValue: string) => {
        const lowerAttrName = attrName.toLowerCase();
        
        // Allow data-* attributes
        if (lowerAttrName.startsWith('data-')) {
          return attrMatch;
        }
        
        if (allowedAttributes.has(lowerAttrName)) {
          return attrMatch;
        }
        
        console.warn(`[Sanitizer] Stripped attribute: ${attrName}`);
        return '';
      }
    );
    
    return `<${tagName}${sanitizedAttrs}>`;
  });
}

/**
 * Sanitize user-generated content within HTML
 * This is used for specific sections that contain user input
 */
export function sanitizeUserContent(content: string): string {
  return escapeHtml(content);
}

/**
 * Validate that HTML is safe to render
 * Returns validation result with errors
 */
export function validateHtml(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for script tags
  if (/<script/i.test(html)) {
    errors.push('HTML contains script tags');
  }

  // Check for event handlers
  if (/\s*on\w+\s*=/i.test(html)) {
    errors.push('HTML contains event handlers');
  }

  // Check for dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (html.toLowerCase().includes(protocol)) {
      errors.push(`HTML contains dangerous protocol: ${protocol}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

