import express, { Response, NextFunction, Request } from 'express';
import sanitize from 'sanitize-html';
import { Op } from 'sequelize';
import { Team } from '../model/team';
import { User } from '../model/user';

const router = express.Router();

router.get(
  '/teams/:keyword/:lastId',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { keyword, lastId: stringLastId } = req.params;
      const pureKeyword = sanitize(keyword);
      const lastId = parseInt(stringLastId, 10);

      let where: any = {};

      if (pureKeyword !== 'no-data') {
        where.name = { [Op.like]: `%${pureKeyword}%` };
      }
      if (lastId !== -1) {
        where.id = {
          [Op.lt]: lastId,
        };
      }

      const teams = await Team.findAll({
        limit: 15,
        where,
        order: [['createdAt', 'DESC']],
      });

      if (teams.length === 15) {
        return res.json({
          code: 'OK',
          payload: teams,
          message: `이름이 ${keyword}가 포함된 팀들의 정보입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: teams,
          message: `이름이 ${keyword}가 포함된 팀들의 마지막 정보입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/users/:keyword',
  async (req: any, res: Response, next: NextFunction) => {
    const { keyword } = req.params;

    try {
      const pureKeyword = sanitize(keyword);

      const users = await User.findAll({
        where: {
          name: { [Op.like]: `%${pureKeyword}%` },
          id: { [Op.ne]: req.id },
        },
        attributes: ['id', 'name', 'img'],
      });

      return res.status(200).json({
        code: 'OK',
        message: `이름이 ${keyword}가 포함된 유저들의 정보입니다.`,
        payload: users,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
