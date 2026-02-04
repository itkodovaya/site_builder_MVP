/**
 * Default Template
 * Generic template for any business
 */

import { TemplateDefinition } from '../TemplateDefinition';

export const DefaultTemplate: TemplateDefinition = {
  templateId: 'default',
  templateVersion: 1,
  name: 'Default Business',
  description: 'Universal template for any type of business',

  defaults: {
    theme: {
      palette: {
        primary: '#2E4057',
        accent: '#048A81',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#2C3E50',
        mutedText: '#6c757d',
      },
      typography: {
        fontFamily: 'Roboto, system-ui, -apple-system, Arial, sans-serif',
        scale: 'md',
      },
      radius: 'sm',
      spacing: 'md',
    },
    seo: {
      titleSuffix: 'Профессиональные услуги',
      descriptionTemplate: 'Качественный сервис и профессионализм.',
    },
  },

  pages: [
    {
      id: 'home',
      path: '/',
      titleTemplate: 'Главная',
      sections: [
        {
          id: 'hero_1',
          type: 'hero',
          props: {
            headline: 'Добро пожаловать в {{brandName}}',
            subheadline: 'Профессиональные услуги, которым можно доверять.',
            primaryCta: {
              text: 'Узнать больше',
              href: '#about',
            },
            logoAssetId: '{{logoAssetId}}',
          },
        },
        {
          id: 'services_1',
          type: 'features',
          props: {
            title: 'Наши услуги',
            items: [
              {
                title: 'Профессиональный сервис',
                text: 'Экспертные решения для ваших задач.',
              },
              {
                title: 'Клиентская поддержка',
                text: 'Профессиональная поддержка когда вам нужно.',
              },
              {
                title: 'Гарантия качества',
                text: 'Стремление к совершенству во всем.',
              },
            ],
          },
        },
        {
          id: 'about_1',
          type: 'about',
          props: {
            title: 'О компании {{brandName}}',
            text: 'Мы предоставляем качественный сервис с профессионализмом и опытом в сфере {{industryLabel}}.',
          },
        },
        {
          id: 'contact_1',
          type: 'contact',
          props: {
            title: 'Свяжитесь с нами',
            subtitle: 'Мы будем рады ответить на ваши вопросы.',
            fields: ['name', 'email', 'message'],
          },
        },
      ],
    },
  ],
};

