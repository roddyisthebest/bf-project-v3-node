import express, { Response, NextFunction } from 'express';
import { Penalty } from '../model/penalty';
import { User } from '../model/user';
import { Op } from 'sequelize';
import { Service } from '../model/service';
import date from '../util/date';

const router = express.Router();

router.get(
  '/:lastId/team/:teamId',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.params;

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
              TeamId: teamId,
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
          message: `동아리 번호 ${teamId}의 ${date.thisWeekendToString()} 기간의 벌금 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: penaltys,
          message: `동아리 번호 ${teamId}의 ${date.thisWeekendToString()} 기간의 마지막 벌금 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

export default router;
