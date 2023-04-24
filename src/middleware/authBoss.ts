import { Response, NextFunction, Request } from 'express';

const authBoss = async (req: any, res: Response, next: NextFunction) => {
  if (req.id !== parseInt(req.team.bossId, 10)) {
    return res.status(403).json({
      code: 'Forbidden:AuthBoss',
      message: '팀에대한 권한이 없습니다.',
    });
  }
  return next();
};

export default authBoss;
