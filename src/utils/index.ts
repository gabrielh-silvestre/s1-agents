export const deepClone = <T = any>(obj: object): T =>
  JSON.parse(JSON.stringify(obj));
