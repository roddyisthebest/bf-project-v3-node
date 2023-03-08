import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';

const authToken = async (req: any, res: Response, next: NextFunction) => {
  const accessToken = req.headers.authorization;
  jwt.verify(
    accessToken as string,
    process.env.ACCESS_TOKEN_SECRET as string,
    (error, user) => {
      if (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            code: 'Expired',
            message:
              'accessToken이 만료되었습니다. refreshToken으로 accessToken을 갱신해주세요.',
          });
        } else if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            code: 'Invalid Token',
            message: '유효하지 않은 토큰입니다.',
          });
        } else {
          return res.status(400).json({
            msg: '에러입니다!',
            code: 'Bad Request',
          });
        }
      } else {
        req.id = (user as any).id;
        next();
      }
    }
  );
};

export default authToken;
