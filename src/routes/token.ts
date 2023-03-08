import express, { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import token from '../util/token';
const router = express.Router();

router.post('/refresh', (req: any, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(409).json({ code: 'Conflict', msg: '토큰이 없습니다.' });
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string,
    (error: any, user: any) => {
      if (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            code: 'Expired',
            message: 'refreshToken이 만료되었습니다. 다시 로그인해주세요.',
          });
        } else if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            code: 'Invalid Token',
            message: '유효하지 않은 토큰입니다.',
          });
        } else {
          return res.status(400).json({
            code: 'Bad Request',
            message: '에러입니다!',
          });
        }
      } else {
        const accessToken = token.generateAccessToken(user.id);
        return res.status(200).send({
          msg: '토큰이 성공적으로 갱신되었습니다!',
          payload: { accessToken },
          code: 200,
        });
      }
    }
  );
});

export default router;
