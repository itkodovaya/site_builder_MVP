/**
 * Industry Template Provider
 * Provides industry-specific templates with enhanced theme configurations
 */

import { ThemePalette, Typography } from '../../domain/entities/SiteConfig';

export interface IndustryTemplate {
  industry: string;
  themeId: string;
  palette: ThemePalette;
  typography: Typography;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  spacing: 'compact' | 'md' | 'relaxed';
  heroHeading: string;
  heroSubheading: string;
  heroCTA: string;
  metaTitle: string;
  metaDescription: string;
  aboutText: string;
  servicesTitle: string;
  defaultServices: Array<{ title: string; description: string }>;
}

const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  tech: {
    industry: 'tech',
    themeId: 'tech-modern',
    palette: {
      primary: '#0066FF',
      accent: '#00D4FF',
      background: '#ffffff',
      text: '#111111',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      scale: 'md',
    },
    radius: 'md',
    spacing: 'md',
    heroHeading: 'Добро пожаловать в {brandName}',
    heroSubheading: 'Инновационные технологические решения для вашего бизнеса',
    heroCTA: 'Начать',
    metaTitle: 'Инновационные технологические решения',
    metaDescription: 'Передовые технологические решения для вашего бизнеса',
    aboutText: '{brandName} предоставляет инновационные технологические решения для успешного развития бизнеса в цифровую эпоху.',
    servicesTitle: 'Наши услуги',
    defaultServices: [
      { title: 'Разработка ПО', description: 'Индивидуальные программные решения для ваших задач' },
      { title: 'Облачные сервисы', description: 'Масштабируемая облачная инфраструктура и миграция' },
      { title: 'IT-консалтинг', description: 'Экспертная помощь в формировании технологической стратегии' },
    ],
  },
  finance: {
    industry: 'finance',
    themeId: 'finance-professional',
    palette: {
      primary: '#1A5F7A',
      accent: '#86BBD8',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Merriweather, serif',
      scale: 'md',
    },
    radius: 'sm',
    spacing: 'md',
    heroHeading: '{brandName} — Ваш финансовый партнер',
    heroSubheading: 'Профессиональное финансовое планирование и управление капиталом',
    heroCTA: 'Записаться на консультацию',
    metaTitle: 'Профессиональные финансовые услуги',
    metaDescription: 'Надежное финансовое планирование и управление капиталом',
    aboutText: '{brandName} предоставляет экспертные финансовые консультации для достижения ваших целей.',
    servicesTitle: 'Финансовые услуги',
    defaultServices: [
      { title: 'Управление капиталом', description: 'Комплексное планирование и инвестиционные стратегии' },
      { title: 'Финансовое планирование', description: 'Персонализированные финансовые планы на будущее' },
      { title: 'Налоговое консультирование', description: 'Стратегическое налоговое планирование и подготовка' },
    ],
  },
  healthcare: {
    industry: 'healthcare',
    themeId: 'healthcare-trust',
    palette: {
      primary: '#00A896',
      accent: '#028090',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Open Sans, sans-serif',
      scale: 'md',
    },
    radius: 'md',
    spacing: 'md',
    heroHeading: '{brandName} — Забота о вашем здоровье',
    heroSubheading: 'Качественная медицинская помощь с заботой и профессионализмом',
    heroCTA: 'Записаться на прием',
    metaTitle: 'Качественные медицинские услуги',
    metaDescription: 'Профессиональная медицинская помощь для вас и вашей семьи',
    aboutText: '{brandName} предоставляет качественные медицинские услуги с заботой и профессионализмом.',
    servicesTitle: 'Наши услуги',
    defaultServices: [
      { title: 'Первичная помощь', description: 'Комплексное первичное медицинское обслуживание' },
      { title: 'Профилактика', description: 'Обследования и профилактические процедуры' },
      { title: 'Специализированная помощь', description: 'Экспертные специализированные медицинские услуги' },
    ],
  },
  retail: {
    industry: 'retail',
    themeId: 'retail-vibrant',
    palette: {
      primary: '#FF6B6B',
      accent: '#4ECDC4',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Poppins, sans-serif',
      scale: 'md',
    },
    radius: 'lg',
    spacing: 'relaxed',
    heroHeading: 'Откройте для себя {brandName}',
    heroSubheading: 'Качественные товары и исключительный сервис',
    heroCTA: 'В магазин',
    metaTitle: 'Качественные товары и сервис',
    metaDescription: 'Ваше место для качественных товаров и исключительного обслуживания',
    aboutText: '{brandName} предлагает качественные товары с исключительным обслуживанием клиентов.',
    servicesTitle: 'Что мы предлагаем',
    defaultServices: [
      { title: 'Премиум товары', description: 'Тщательно отобранные качественные товары' },
      { title: 'Быстрая доставка', description: 'Быстрая и надежная служба доставки' },
      { title: 'Легкий возврат', description: 'Беспроблемная политика возврата' },
    ],
  },
  education: {
    industry: 'education',
    themeId: 'education-inspire',
    palette: {
      primary: '#5B4B8A',
      accent: '#8E7DBE',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Lato, sans-serif',
      scale: 'md',
    },
    radius: 'sm',
    spacing: 'md',
    heroHeading: '{brandName} — Развиваем потенциал',
    heroSubheading: 'Качественное образование для вашего будущего',
    heroCTA: 'Узнать больше',
    metaTitle: 'Качественные образовательные программы',
    metaDescription: 'Развиваем студентов через качественное образование и инновации',
    aboutText: '{brandName} стремится предоставлять качественное образование и способствовать развитию.',
    servicesTitle: 'Наши программы',
    defaultServices: [
      { title: 'Академические программы', description: 'Комплексная учебная программа для успеха' },
      { title: 'Онлайн-обучение', description: 'Гибкие онлайн-курсы и ресурсы' },
      { title: 'Карьерная поддержка', description: 'Помощь в развитии карьеры' },
    ],
  },
  'real-estate': {
    industry: 'real-estate',
    themeId: 'realestate-premium',
    palette: {
      primary: '#2C3E50',
      accent: '#E67E22',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Raleway, sans-serif',
      scale: 'lg',
    },
    radius: 'sm',
    spacing: 'relaxed',
    heroHeading: '{brandName} — Ваш партнер в недвижимости',
    heroSubheading: 'Найдите идеальную недвижимость с экспертной помощью',
    heroCTA: 'Смотреть объекты',
    metaTitle: 'Премиальные услуги в сфере недвижимости',
    metaDescription: 'Найдите недвижимость вашей мечты с экспертной помощью',
    aboutText: '{brandName} помогает найти идеальную недвижимость для ваших потребностей.',
    servicesTitle: 'Наши услуги',
    defaultServices: [
      { title: 'Продажа недвижимости', description: 'Экспертная помощь в покупке и продаже' },
      { title: 'Управление недвижимостью', description: 'Комплексные услуги по управлению' },
      { title: 'Анализ рынка', description: 'Глубокие исследования и оценка недвижимости' },
    ],
  },
  consulting: {
    industry: 'consulting',
    themeId: 'consulting-professional',
    palette: {
      primary: '#34495E',
      accent: '#95A5A6',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Source Sans Pro, sans-serif',
      scale: 'md',
    },
    radius: 'none',
    spacing: 'compact',
    heroHeading: '{brandName} — Стратегические решения',
    heroSubheading: 'Профессиональный консалтинг для развития вашего бизнеса',
    heroCTA: 'Связаться с нами',
    metaTitle: 'Профессиональные консалтинговые услуги',
    metaDescription: 'Стратегический консалтинг для развития вашего бизнеса',
    aboutText: '{brandName} предоставляет стратегические консалтинговые услуги для успеха вашего бизнеса.',
    servicesTitle: 'Консалтинговые услуги',
    defaultServices: [
      { title: 'Стратегический консалтинг', description: 'Стратегическое планирование и исполнение' },
      { title: 'Операционный консалтинг', description: 'Оптимизация бизнес-операций' },
      { title: 'Управление изменениями', description: 'Сопровождение организационных трансформаций' },
    ],
  },
  restaurant: {
    industry: 'restaurant',
    themeId: 'restaurant-delicious',
    palette: {
      primary: '#D64045',
      accent: '#FFA69E',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Playfair Display, serif',
      scale: 'lg',
    },
    radius: 'md',
    spacing: 'relaxed',
    heroHeading: 'Добро пожаловать в {brandName}',
    heroSubheading: 'Превосходная кухня и незабываемые впечатления',
    heroCTA: 'Посмотреть меню',
    metaTitle: 'Восхитительные кулинарные впечатления',
    metaDescription: 'Превосходная кухня и незабываемые гастрономические впечатления',
    aboutText: '{brandName} предлагает свежую, вкусную еду в уютной атмосфере.',
    servicesTitle: 'Что мы предлагаем',
    defaultServices: [
      { title: 'Обеды в зале', description: 'Насладитесь полным меню в комфортной обстановке' },
      { title: 'На вынос', description: 'Закажите любимые блюда с собой' },
      { title: 'Кейтеринг', description: 'Доверьте нам организацию ваших особых мероприятий' },
    ],
  },
  other: {
    industry: 'other',
    themeId: 'business-classic',
    palette: {
      primary: '#2E4057',
      accent: '#048A81',
      background: '#ffffff',
      text: '#2C3E50',
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      scale: 'md',
    },
    radius: 'sm',
    spacing: 'md',
    heroHeading: 'Добро пожаловать в {brandName}',
    heroSubheading: 'Профессиональные услуги, которым можно доверять',
    heroCTA: 'Узнать больше',
    metaTitle: 'Профессиональные бизнес-услуги',
    metaDescription: 'Качественный сервис и профессионализм, которым можно доверять',
    aboutText: '{brandName} предоставляет качественный сервис с профессионализмом и опытом.',
    servicesTitle: 'Наши услуги',
    defaultServices: [
      { title: 'Профессиональный сервис', description: 'Экспертные решения для ваших задач' },
      { title: 'Клиентская поддержка', description: 'Профессиональная поддержка когда вам нужно' },
      { title: 'Гарантия качества', description: 'Стремление к совершенству во всем' },
    ],
  },
};

export class IndustryTemplateProvider {
  getTemplate(industryCode: string): IndustryTemplate {
    return INDUSTRY_TEMPLATES[industryCode] || INDUSTRY_TEMPLATES.other;
  }

  getAllIndustries(): string[] {
    return Object.keys(INDUSTRY_TEMPLATES);
  }
}
