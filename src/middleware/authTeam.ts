// 팀에 합류한 사람인가 체크하는 미들웨어
import { Response, NextFunction, Request } from 'express';
import { Team } from '../model/team';

const authTeam = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { teamId: paramsId } = req.params;
    const { teamId: bodyId } = req.body;
    let teamId;
    if (paramsId) {
      teamId = parseInt(paramsId, 10);
    }
    if (bodyId) {
      teamId = parseInt(bodyId);
    }

    const team: any = await Team.findOne({ where: { id: teamId } });

    const user = await team.getUsers({
      where: { id: req.id },
    });

    if (user) {
      req.team = team;
      return next();
    }
    return res.status(403).json({
      code: 'Forbidden',
      message: '권한이 없습니다.',
    });
  } catch (e) {
    next(e);
  }
};

export default authTeam;
