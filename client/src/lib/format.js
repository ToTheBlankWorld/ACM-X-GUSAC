export const money = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

export const shortDate = (value) => {
  try {
    return new Date(value.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

export const discountPercent = (price, compareAt) =>
  compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;
