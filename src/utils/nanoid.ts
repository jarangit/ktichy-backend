const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const generateId = (length: number): string => {
  let id = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ALPHABET.length);
    id += ALPHABET[index];
  }
  return id;
};

export const nanoid10 = (): string => generateId(10);
export const nanoid16 = (): string => generateId(16);
