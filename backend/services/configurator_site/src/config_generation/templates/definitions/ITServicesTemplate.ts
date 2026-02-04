/**
 * IT Services Template
 * For tech/software companies
 */

import { TemplateDefinition } from '../TemplateDefinition';

export const ITServicesTemplate: TemplateDefinition = {
  templateId: 'it_services',
  templateVersion: 1,
  name: 'IT Services',
  description: 'Modern template for IT services and tech companies',

  defaults: {
    theme: {
      palette: {
        primary: '#025add',
        accent: '#4820a7',
        background: '#ffffff',
        surface: '#f5f7ff',
        text: '#0b1220',
        mutedText: '#5c667a',
      },
      typography: {
        fontFamily: 'Manrope, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        scale: 'md',
      },
      radius: 'md',
      spacing: 'md',
    },
    seo: {
      titleSuffix: 'IT-услуги',
      descriptionTemplate: 'Разработка сайтов и цифровых продуктов для бизнеса.',
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
            headline: '{{brandName}} — IT-услуги для роста бизнеса',
            subheadline: 'Сайты, дизайн и разработка под ключ. Быстрый старт, понятный процесс.',
            primaryCta: {
              text: 'Получить консультацию',
              href: '#contact',
            },
            secondaryCta: {
              text: 'Посмотреть кейсы',
              href: '#cases',
            },
            logoAssetId: '{{logoAssetId}}',
          },
        },
        {
          id: 'services_1',
          type: 'features',
          props: {
            title: 'Что мы делаем',
            items: [
              {
                title: 'Сайты',
                text: 'Лендинги, корпоративные, магазины.',
              },
              {
                title: 'Дизайн',
                text: 'Логотипы, обложки, UI/UX.',
              },
              {
                title: 'Поддержка',
                text: 'Сопровождение и доработки.',
              },
            ],
          },
        },
        {
          id: 'about_1',
          type: 'about',
          props: {
            title: 'О нас',
            text: 'Мы — {{brandName}}, команда профессионалов в сфере {{industryLabel}}. Помогаем бизнесу расти через качественные цифровые решения.',
          },
        },
        {
          id: 'contact_1',
          type: 'contact',
          props: {
            title: 'Связаться с нами',
            subtitle: 'Оставьте заявку — мы ответим в течение дня.',
            fields: ['name', 'phone', 'message'],
          },
        },
      ],
    },
  ],
};

