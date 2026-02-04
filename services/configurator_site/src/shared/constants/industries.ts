/**
 * Global Industry Taxonomy
 * Comprehensive categorization of business domains
 */

export interface IndustryCategory {
  name: string;
  subcategories: string[];
  defaultTags: string[];
}

export const INDUSTRY_TAXONOMY: Record<string, IndustryCategory> = {
  Technology: {
    name: 'Technology',
    subcategories: [
      'SaaS',
      'E-commerce Platform',
      'Mobile Apps',
      'AI/ML',
      'Cybersecurity',
      'Cloud Services',
      'DevOps Tools',
      'Analytics',
      'IoT',
      'Blockchain',
    ],
    defaultTags: ['Innovation', 'Digital', 'Software', 'Tech'],
  },

  'E-commerce': {
    name: 'E-commerce',
    subcategories: [
      'Fashion',
      'Electronics',
      'Food & Beverage',
      'Handmade',
      'Home & Garden',
      'Beauty & Cosmetics',
      'Sports & Fitness',
      'Books & Media',
      'Jewelry',
      'Pet Supplies',
    ],
    defaultTags: ['Online Store', 'Retail', 'Shopping', 'B2C'],
  },

  'Professional Services': {
    name: 'Professional Services',
    subcategories: [
      'Consulting',
      'Legal',
      'Accounting',
      'Marketing Agency',
      'Design Agency',
      'Real Estate',
      'Financial Advisory',
      'HR Services',
      'Business Coaching',
      'Translation Services',
    ],
    defaultTags: ['B2B', 'Services', 'Professional', 'Expertise'],
  },

  Healthcare: {
    name: 'Healthcare',
    subcategories: [
      'Telemedicine',
      'Medical Practice',
      'Dental',
      'Mental Health',
      'Fitness & Wellness',
      'Nutrition',
      'Physical Therapy',
      'Veterinary',
      'Health Tech',
      'Pharmacy',
    ],
    defaultTags: ['Health', 'Wellness', 'Medical', 'Care'],
  },

  Education: {
    name: 'Education',
    subcategories: [
      'Online Courses',
      'Tutoring',
      'Language Learning',
      'Skill Development',
      'K-12 Education',
      'Higher Education',
      'Corporate Training',
      'Vocational Training',
      'Music & Arts',
      'STEM Education',
    ],
    defaultTags: ['Learning', 'Education', 'Training', 'Knowledge'],
  },

  'Hospitality & Tourism': {
    name: 'Hospitality & Tourism',
    subcategories: [
      'Hotels & Resorts',
      'Restaurants',
      'Travel Agency',
      'Tour Operator',
      'Event Venue',
      'Catering',
      'Bed & Breakfast',
      'Vacation Rentals',
      'Adventure Tourism',
      'Cruise Lines',
    ],
    defaultTags: ['Travel', 'Hospitality', 'Tourism', 'Leisure'],
  },

  'Creative & Media': {
    name: 'Creative & Media',
    subcategories: [
      'Photography',
      'Videography',
      'Graphic Design',
      'Content Creation',
      'Podcast',
      'Music Production',
      'Animation',
      'Publishing',
      'Art Gallery',
      'Performing Arts',
    ],
    defaultTags: ['Creative', 'Media', 'Art', 'Content'],
  },

  'Construction & Real Estate': {
    name: 'Construction & Real Estate',
    subcategories: [
      'Residential Construction',
      'Commercial Construction',
      'Architecture',
      'Interior Design',
      'Property Management',
      'Real Estate Development',
      'Renovation',
      'Landscaping',
      'Urban Planning',
      'Home Inspection',
    ],
    defaultTags: ['Construction', 'Building', 'Property', 'Real Estate'],
  },

  'Automotive': {
    name: 'Automotive',
    subcategories: [
      'Car Dealership',
      'Auto Repair',
      'Car Rental',
      'Auto Parts',
      'Detailing',
      'Towing',
      'Fleet Management',
      'Electric Vehicles',
      'Motorcycle',
      'RV & Campers',
    ],
    defaultTags: ['Automotive', 'Vehicles', 'Cars', 'Transportation'],
  },

  'Manufacturing': {
    name: 'Manufacturing',
    subcategories: [
      'Consumer Goods',
      'Industrial Equipment',
      'Electronics',
      'Food Processing',
      'Textiles',
      'Furniture',
      'Chemicals',
      'Packaging',
      'Aerospace',
      'Medical Devices',
    ],
    defaultTags: ['Manufacturing', 'Production', 'Industrial', 'B2B'],
  },

  'Non-Profit & Community': {
    name: 'Non-Profit & Community',
    subcategories: [
      'Charity',
      'Foundation',
      'Religious Organization',
      'Community Group',
      'Environmental',
      'Animal Welfare',
      'Social Services',
      'Advocacy',
      'Arts & Culture',
      'Youth Programs',
    ],
    defaultTags: ['Non-Profit', 'Community', 'Social Impact', 'Charity'],
  },

  'Financial Services': {
    name: 'Financial Services',
    subcategories: [
      'Banking',
      'Investment',
      'Insurance',
      'Fintech',
      'Cryptocurrency',
      'Wealth Management',
      'Payment Processing',
      'Lending',
      'Tax Services',
      'Credit Union',
    ],
    defaultTags: ['Finance', 'Money', 'Banking', 'Investment'],
  },
};

/**
 * Validate industry category and subcategory
 */
export function validateIndustry(
  category: string,
  subcategory: string
): { valid: boolean; error?: string } {
  const industryCategory = INDUSTRY_TAXONOMY[category];

  if (!industryCategory) {
    return {
      valid: false,
      error: `Invalid category. Must be one of: ${Object.keys(INDUSTRY_TAXONOMY).join(', ')}`,
    };
  }

  if (!industryCategory.subcategories.includes(subcategory)) {
    return {
      valid: false,
      error: `Invalid subcategory for ${category}. Must be one of: ${industryCategory.subcategories.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Object.keys(INDUSTRY_TAXONOMY);
}

/**
 * Get subcategories for a category
 */
export function getSubcategories(category: string): string[] {
  return INDUSTRY_TAXONOMY[category]?.subcategories || [];
}

/**
 * Get default tags for a category
 */
export function getDefaultTags(category: string): string[] {
  return INDUSTRY_TAXONOMY[category]?.defaultTags || [];
}
