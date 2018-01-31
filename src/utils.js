
export const stripNewlines = str => str.replace(/[\r\n]/g, '');

export const restrict = (int, min, max) => Math.min(Math.max(int, min), max);
