export const formatNumberLatino = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('es-ES');
};

// Para valores abreviados tipo "K" o "M":
export const formatStarsK = (stars) => {
  if (stars === null || stars === undefined) return '0';
  if (stars >= 1000000) {
    return (stars / 1000000).toFixed(1).replace('.', ',') + 'M';
  }
  if (stars >= 1000) {
    // If stars is exactly divisible by 1000 without decimal fraction, don't show decimal
    const val = stars / 1000;
    if (val >= 10) {
      return Math.round(val).toLocaleString('es-ES') + 'k';
    }
    return val.toFixed(1).replace('.', ',') + 'k';
  }
  return formatNumberLatino(stars);
};
