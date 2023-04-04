import { Request } from '@loopback/rest';

export const rateLimitKeyGen = (req: Request): string => {
  const token: string = req.headers?.authorization?.replace(/Bearer /i, '') || '';
  //console.log('token', token);
  return token;
};
