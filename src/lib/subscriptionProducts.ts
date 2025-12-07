// Subscription product configuration with Stripe product IDs
import coffeeYirgacheffe from "@/assets/coffee-yirgacheffe.jpg";
import coffeeSidamo from "@/assets/coffee-sidamo.jpg";
import coffeeHarar from "@/assets/coffee-harar.jpg";

export interface SubscriptionProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stripeProductId: string;
  imageUrl: string;
}

// These are mapped to the Stripe products created
export const subscriptionProducts: SubscriptionProduct[] = [
  {
    id: "ethiopian-yirgacheffe",
    name: "Ethiopian Yirgacheffe",
    description: "Light roast with floral notes and citrus undertones",
    price: 18.99,
    stripeProductId: "prod_TYeCF06JT7TT0T",
    imageUrl: coffeeYirgacheffe,
  },
  {
    id: "sidamo-dark-roast",
    name: "Sidamo Dark Roast",
    description: "Bold and rich with chocolate notes",
    price: 16.99,
    stripeProductId: "prod_TYeCYP1mJoA0Kn",
    imageUrl: coffeeSidamo,
  },
  {
    id: "harar-heritage-blend",
    name: "Harar Heritage Blend",
    description: "Medium roast with wine-like acidity",
    price: 19.99,
    stripeProductId: "prod_TYeDcUTgXeRQQM",
    imageUrl: coffeeHarar,
  },
];

export const grindOptions = [
  { value: "whole_bean", label: "Whole Bean" },
  { value: "espresso", label: "Espresso (Fine)" },
  { value: "drip", label: "Drip (Medium)" },
  { value: "french_press", label: "French Press (Coarse)" },
  { value: "pour_over", label: "Pour Over (Medium-Fine)" },
];

export const bagSizeOptions = [
  { value: "12oz", label: "12 oz", priceMultiplier: 1 },
  { value: "2lb", label: "2 lb", priceMultiplier: 2.5 },
  { value: "5lb", label: "5 lb", priceMultiplier: 5.5 },
];

export const frequencyOptions = [
  { value: "weekly", label: "Every Week", days: 7 },
  { value: "biweekly", label: "Every 2 Weeks", days: 14 },
  { value: "every_3_weeks", label: "Every 3 Weeks", days: 21 },
  { value: "every_4_weeks", label: "Every 4 Weeks", days: 28 },
  { value: "monthly", label: "Monthly", days: 30 },
];
