import { Response, NextFunction } from 'express';

const authAdmin = async (req: any, res: Response, next: NextFunction) => {
  if (!req.user.admin) {
    return res.status(403).json({
      code: 'Forbidden:AuthAdmin',
      message: '관리자 계정이 아닙니다.',
    });
  }
  return next();
};

export default authAdmin;
