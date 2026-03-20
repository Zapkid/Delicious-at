/** Seeded demo accounts — keep in sync with `npm run seed:demo`. */
export interface DemoSellerDefinition {
  readonly email: string;
  readonly shop: string;
  readonly items: readonly string[];
}

export const DEMO_SELLERS: readonly DemoSellerDefinition[] = [
  {
    email: "seller1@seed.local",
    shop: "Maya's Home Kitchen",
    items: [
      "Sourdough loaf",
      "Vegan hummus plate",
      "Rosemary focaccia",
    ],
  },
  {
    email: "seller2@seed.local",
    shop: "Coastal Pickles",
    items: [
      "Spicy pickled cucumbers",
      "Olive mix",
      "Kimchi jar",
    ],
  },
  {
    email: "seller3@seed.local",
    shop: "Sweet Stop TLV",
    items: [
      "Halva brownies",
      "Rugelach box",
      "Date & walnut cookies",
    ],
  },
] as const;

export function isDemoSellerEmail(email: string): boolean {
  const n: string = email.trim().toLowerCase();
  return DEMO_SELLERS.some(
    (s: DemoSellerDefinition): boolean => s.email.toLowerCase() === n
  );
}
