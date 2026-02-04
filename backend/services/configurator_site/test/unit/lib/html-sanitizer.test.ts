/**
 * HTML Sanitizer Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { sanitizeHtml, validateHtml } from '../../../src/lib/html-sanitizer';

describe('HTML Sanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<div>Safe content</div><script>alert("xss")</script>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Safe content');
    });

    it('should remove event handlers', () => {
      const html = '<button onclick="alert(1)">Click</button>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('Click');
    });

    it('should sanitize javascript: URLs', () => {
      const html = '<a href="javascript:alert(1)">Link</a>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('href="#"');
    });

    it('should allow safe HTML tags', () => {
      const html = '<div class="container"><h1>Title</h1><p>Content</p></div>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).toContain('<div');
      expect(sanitized).toContain('<h1>');
      expect(sanitized).toContain('<p>');
    });

    it('should allow safe attributes', () => {
      const html = '<div class="test" id="main" data-value="123">Content</div>';
      const sanitized = sanitizeHtml(html);

      expect(sanitized).toContain('class="test"');
      expect(sanitized).toContain('id="main"');
      expect(sanitized).toContain('data-value="123"');
    });

    it('should handle complex nested HTML', () => {
      const html = `
        <div class="page">
          <header>
            <h1>Title</h1>
          </header>
          <main>
            <section class="hero">
              <p>Content</p>
            </section>
          </main>
        </div>
      `;
      const sanitized = sanitizeHtml(html);

      expect(sanitized).toContain('<header>');
      expect(sanitized).toContain('<main>');
      expect(sanitized).toContain('class="hero"');
    });
  });

  describe('validateHtml', () => {
    it('should validate safe HTML', () => {
      const html = '<div><h1>Title</h1><p>Content</p></div>';
      const result = validateHtml(html);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect script tags', () => {
      const html = '<div><script>alert(1)</script></div>';
      const result = validateHtml(html);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HTML contains script tags');
    });

    it('should detect event handlers', () => {
      const html = '<button onclick="alert(1)">Click</button>';
      const result = validateHtml(html);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect dangerous protocols', () => {
      const html = '<a href="javascript:alert(1)">Link</a>';
      const result = validateHtml(html);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('javascript:'))).toBe(true);
    });
  });
});

