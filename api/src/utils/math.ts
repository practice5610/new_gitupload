export const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(min + (max - min) * Math.random());
};
