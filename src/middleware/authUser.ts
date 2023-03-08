import { Response, NextFunction } from 'express';

const authUser = async (req: any, res: Response, next: NextFunction) => {
  if (req.id !== parseInt(req.params.id, 10)) {
    return res.status(403).json({
      message: '권한이 없습니다.',
      code: 'Forbidden',
    });
  }
  next();
};

export default authUser;
