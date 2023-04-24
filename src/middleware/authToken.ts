import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { publicKey } from '../util/token';

const authToken = async (req: any, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization;
  console.log('accessToken', accessToken);
  jwt.verify(accessToken as string, publicKey, (error, user) => {
    if (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          code: 'Expired:AccessToken',
          message:
            'accessToken이 만료되었습니다. refreshToken으로 accessToken을 갱신해주세요.',
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          code: 'Invalid AccessToken',
          message: '유효하지 않은 토큰입니다.',
        });
      } else {
        return res.status(400).json({
          message: '에러입니다!',
          code: 'Bad Request:Token',
        });
      }
    } else {
      req.id = (user as any).id;
      req.name = (user as any).name;
      next();
    }
  });
};

export default authToken;
