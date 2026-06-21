import { CookingStyle, CookingTime } from '../models/recipe.model';

export const STYLE_LABELS: Record<CookingStyle, string> = {
  german: 'German',
  italian: 'Italian',
  japanese: 'Japanese',
  indian: 'Indian',
  gourmet: 'Gourmet',
  fusion: 'Fusion',
};

export const TIME_LABELS: Record<CookingTime, string> = {
  quick: 'Quick',
  medium: 'Medium',
  elaborate: 'Complex',
};

export const TIME_MINUTES: Record<CookingTime, string> = {
  quick: 'up to 20min',
  medium: '25-40min',
  elaborate: '45+ min',
};