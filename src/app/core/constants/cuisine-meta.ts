import { CookingStyle } from '../models/recipe.model';

export interface CuisineMeta {
  image: string;
  mobileImage: string;
  title: string;
}

export const CUISINE_META: Record<CookingStyle, CuisineMeta> = {
  italian: {
    image: 'assets/images/recipes/italian-food.png',
    mobileImage: 'assets/images/mobile/recipe/italian-cuisine-mobile.png',
    title: 'Italian cuisine',
  },
  german: {
    image: 'assets/images/recipes/german-food.png',
    mobileImage: 'assets/images/mobile/recipe/german-cuisine-mobile.png',
    title: 'German cuisine',
  },
  japanese: {
    image: 'assets/images/recipes/japanese-food.png',
    mobileImage: 'assets/images/mobile/recipe/japanese-cuisine-mobile.png',
    title: 'Japanese cuisine',
  },
  indian: {
    image: 'assets/images/recipes/indian-food.png',
    mobileImage: 'assets/images/mobile/recipe/indian-cuisine-mobile.png',
    title: 'Indian cuisine',
  },
  gourmet: {
    image: 'assets/images/recipes/gourmet-food.png',
    mobileImage: 'assets/images/mobile/recipe/gourmet-cuisine-mobile.png',
    title: 'Gourmet cuisine',
  },
  fusion: {
    image: 'assets/images/recipes/fusion-food.png',
    mobileImage: 'assets/images/mobile/recipe/fusion-cuisine-mobile.png',
    title: 'Fusion cuisine',
  },
};

export interface CookbookCuisineCard {
  style: CookingStyle;
  label: string;
  emoji: string;
  image: string;
}

export const COOKBOOK_CUISINES: CookbookCuisineCard[] = [
  { style: 'italian', label: 'Italian', emoji: '🤌', image: 'assets/images/cookbook/italian.png' },
  { style: 'german', label: 'German', emoji: '🍻', image: 'assets/images/cookbook/german.png' },
  { style: 'japanese', label: 'Japanese', emoji: '🍜', image: 'assets/images/cookbook/japan.png' },
  { style: 'gourmet', label: 'Gourmet', emoji: '🤌', image: 'assets/images/cookbook/gourmet.png' },
  { style: 'indian', label: 'Indian', emoji: '🍛', image: 'assets/images/cookbook/indian.png' },
  { style: 'fusion', label: 'Fusion', emoji: '🍢', image: 'assets/images/cookbook/fusion.png' },
];