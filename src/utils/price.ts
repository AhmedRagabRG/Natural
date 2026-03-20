// Price formatting and points calculation utilities

export const formatPrice = (price: number | null | undefined): string => {
  // Handle null/undefined values
  if (price === null || price === undefined) {
    return "0.00";
  }
  // Always show 2 decimal places for all prices
  return price.toFixed(2);
};

export const calculateRewardPoints = (price: number): number => {
  // Multiply price by 3 to get reward points
  return Math.floor(price * 3);
};