/**
 * Formats a price number, showing decimals only if the price has non-zero decimal places.
 * For example: 10.00 -> "10", 10.50 -> "10.50", 10.5 -> "10.50"
 *
 * @param price - The price number to format
 * @returns Formatted price string with decimals only when needed
 */
export function formatPrice(price: number): string {
  // Check if the price has non-zero decimal places
  const hasDecimals = price % 1 !== 0;

  if (hasDecimals) {
    // Show 2 decimal places if there are decimals
    return price.toFixed(2);
  }

  // Show as integer if no decimals
  return Math.round(price).toString();
}
