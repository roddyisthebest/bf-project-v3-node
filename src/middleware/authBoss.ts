import { Response, NextFunction, Request } from 'express';

const authBoss = async (req: any, res: Response, next: NextFunction) => {
  if (req.id === req.team.bossId) {
    return res.status(403).json({
      code: 'Forbidden',
      message: '팀에대한 권한이 없습니다.',
    });
  }
  next();
};

export default authBoss;
