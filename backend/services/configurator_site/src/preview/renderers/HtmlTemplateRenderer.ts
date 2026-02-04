/**
 * HTML Template Renderer
 * Renders SiteConfig to HTML using templates
 */

import ejs from 'ejs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SiteConfig, PageSection } from '../../domain/entities/SiteConfig';

export class HtmlTemplateRenderer {
  private templateCache: Map<string, string> = new Map();
  private readonly templatesDir: string;

  constructor(templatesDir?: string) {
    // ES modules: get __dirname equivalent
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.templatesDir = templatesDir || join(__dirname, '../templates');
  }

  async render(config: SiteConfig): Promise<string> {
    const template = await this.loadTemplate('main.ejs');
    
    const data = {
      brandName: config.getBrandName().toString(),
      logoUrl: config.getLogoUrl(),
      theme: config.getTheme(),
      metadata: config.getMetadata(),
      sections: config.getPages().home.sections,
      contact: config.getContact(),
      social: config.getSocial(),
      currentYear: new Date().getFullYear(),
    };

    return ejs.render(template, data, {
      async: false,
    });
  }

  private async loadTemplate(name: string): Promise<string> {
    if (this.templateCache.has(name)) {
      return this.templateCache.get(name)!;
    }

    try {
      const templatePath = join(this.templatesDir, name);
      const content = await readFile(templatePath, 'utf-8');
      this.templateCache.set(name, content);
      return content;
    } catch (error) {
      // Fallback to inline template if file not found
      return this.getDefaultTemplate();
    }
  }

  private getDefaultTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= metadata.title %></title>
  <meta name="description" content="<%= metadata.description %>">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: <%= theme.fontFamily %>;
      line-height: 1.6;
      color: #333;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    header {
      background: <%= theme.primaryColor %>;
      color: white;
      padding: 1rem 0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .logo img {
      height: 50px;
      width: auto;
    }
    
    .brand-name {
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    section {
      padding: 4rem 0;
    }
    
    .hero {
      background: linear-gradient(135deg, <%= theme.primaryColor %>, <%= theme.secondaryColor || theme.primaryColor %>);
      color: white;
      text-align: center;
      padding: 6rem 0;
    }
    
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .hero p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    
    .cta-button {
      display: inline-block;
      padding: 1rem 2rem;
      background: white;
      color: <%= theme.primaryColor %>;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      transition: transform 0.2s;
    }
    
    .cta-button:hover {
      transform: scale(1.05);
    }
    
    .section-title {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      color: <%= theme.primaryColor %>;
    }
    
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    
    .service-card {
      padding: 2rem;
      background: #f9f9f9;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .service-card h3 {
      color: <%= theme.primaryColor %>;
      margin-bottom: 1rem;
    }
    
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 5px;
    }
    
    footer {
      background: #333;
      color: white;
      padding: 2rem 0;
      text-align: center;
    }
    
    .social-links {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1rem;
    }
    
    .social-links a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      background: <%= theme.primaryColor %>;
      border-radius: 5px;
      transition: opacity 0.2s;
    }
    
    .social-links a:hover {
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo">
          <% if (logoUrl) { %>
            <img src="<%= logoUrl %>" alt="<%= brandName %> Logo">
          <% } %>
          <div class="brand-name"><%= brandName %></div>
        </div>
      </div>
    </div>
  </header>

  <% sections.forEach(section => { %>
    <% if (section.visible) { %>
      <% if (section.type === 'hero') { %>
        <section class="hero">
          <div class="container">
            <h1><%= section.content.heading %></h1>
            <p><%= section.content.subheading %></p>
            <a href="#contact" class="cta-button"><%= section.content.ctaText %></a>
          </div>
        </section>
      <% } else if (section.type === 'about') { %>
        <section id="about">
          <div class="container">
            <h2 class="section-title"><%= section.content.title %></h2>
            <p style="text-align: center; font-size: 1.125rem; max-width: 800px; margin: 0 auto;">
              <%= section.content.body %>
            </p>
          </div>
        </section>
      <% } else if (section.type === 'services') { %>
        <section id="services" style="background: #f9f9f9;">
          <div class="container">
            <h2 class="section-title"><%= section.content.title %></h2>
            <div class="services-grid">
              <% section.content.items.forEach(service => { %>
                <div class="service-card">
                  <h3><%= service.title %></h3>
                  <p><%= service.description %></p>
                </div>
              <% }); %>
            </div>
          </div>
        </section>
      <% } else if (section.type === 'contact') { %>
        <section id="contact">
          <div class="container">
            <h2 class="section-title"><%= section.content.title %></h2>
            <div class="contact-info">
              <% if (section.content.email) { %>
                <div class="contact-item">
                  <strong>Email:</strong> <a href="mailto:<%= section.content.email %>"><%= section.content.email %></a>
                </div>
              <% } %>
              <% if (section.content.phone) { %>
                <div class="contact-item">
                  <strong>Phone:</strong> <a href="tel:<%= section.content.phone %>"><%= section.content.phone %></a>
                </div>
              <% } %>
              <% if (section.content.address) { %>
                <div class="contact-item">
                  <strong>Address:</strong> <%= section.content.address %>
                </div>
              <% } %>
            </div>
          </div>
        </section>
      <% } %>
    <% } %>
  <% }); %>

  <footer>
    <div class="container">
      <p><%= sections.find(s => s.type === 'footer')?.content.copyright %></p>
      <% if (social && (social.facebook || social.twitter || social.instagram || social.linkedin)) { %>
        <div class="social-links">
          <% if (social.facebook) { %>
            <a href="<%= social.facebook %>" target="_blank" rel="noopener">Facebook</a>
          <% } %>
          <% if (social.twitter) { %>
            <a href="<%= social.twitter %>" target="_blank" rel="noopener">Twitter</a>
          <% } %>
          <% if (social.instagram) { %>
            <a href="<%= social.instagram %>" target="_blank" rel="noopener">Instagram</a>
          <% } %>
          <% if (social.linkedin) { %>
            <a href="<%= social.linkedin %>" target="_blank" rel="noopener">LinkedIn</a>
          <% } %>
        </div>
      <% } %>
    </div>
  </footer>
</body>
</html>`;
  }
}

