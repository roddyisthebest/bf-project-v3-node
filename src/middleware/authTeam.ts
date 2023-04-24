// 팀에 합류한 사람인가 체크하는 미들웨어
import { Response, NextFunction, Request } from 'express';
import { Team } from '../model/team';

const authTeam = async (req: any, res: Response, next: NextFunction) => {
  try {
    let teamId;

    if (req.params.teamId) {
      teamId = parseInt(req.params.teamId, 10);
    }
    if (req.body.teamId) {
      teamId = parseInt(req.body.teamId, 10);
    }

    console.log('teamId', teamId);

    const team: any = await Team.findOne({ where: { id: teamId } });

    if (team === null) {
      return res
        .status(404)
        .json({ code: 'Not Found:Team', message: '팀이 이미 삭제되었습니다.' });
    }
    console.log('req.id', req.id);

    const user = await team.getUsers({
      where: { id: req.id },
    });

    if (user && user.length !== 0) {
      req.team = team;
      return next();
    }
    return res.status(403).json({
      code: 'Forbidden:AuthTeam',
      message: '권한이 없습니다.',
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export default authTeam;
