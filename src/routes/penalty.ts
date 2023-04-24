import express, { Response, NextFunction } from 'express';
import { Penalty } from '../model/penalty';
import { User } from '../model/user';
import { Op } from 'sequelize';
import { Service } from '../model/service';
import date from '../util/date';
import authTeam from '../middleware/authTeam';
import authBoss from '../middleware/authBoss';

const router = express.Router();

router.get(
  '/:lastId/team/:teamId',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const where = { id: {} };
      const lastId = parseInt(req.params.lastId, 10);
      if (lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }
      const penaltys = await User.findAll({
        include: [
          {
            model: Penalty,
            where: {
              weekend: { [Op.eq]: date.thisWeekendToString() },
              TeamId: req.team.id,
            },
          },
          {
            model: Service,
            where: {
              penalty: { [Op.ne]: false },
            },
            attributes: [],
          },
        ],
        order: [['id', 'DESC']],
        limit: 5,
        where: lastId === -1 ? {} : where,
      });
      if (penaltys.length === 5) {
        return res.json({
          code: 'OK',
          payload: penaltys,
          message: `동아리 ${
            req.team.name
          }의 ${date.thisWeekendToString()} 기간의 벌금 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: penaltys,
          message: `동아리 번호 ${
            req.team.name
          }의 ${date.thisWeekendToString()} 기간의 마지막 벌금 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.patch(
  '',
  authTeam,
  authBoss,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { paper, id } = req.body;

      await Penalty.update(
        {
          paper,
        },
        { where: { id } }
      );

      return res.json({
        code: 'OK',
        message: '성공적으로 Penalty 정보가 변경되었습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

export default router;
