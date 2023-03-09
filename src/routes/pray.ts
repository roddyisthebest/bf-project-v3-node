import express, { Response, NextFunction } from 'express';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { Pray } from '../model/pray';
import sanitizeHtml from 'sanitize-html';
import { Service } from '../model/service';
import date from '../util/date';

const router = express.Router();

router.get(
  ':lastId/team/:teamId/weekend/:weekend',
  async (req: any, res: Response, next: NextFunction) => {
    const { weekend, teamId } = req.params;
    const where = { id: {}, TeamId: teamId };
    const lastId = parseInt(req.params.lastId, 10);
    if (lastId !== -1) {
      where.id = { [Op.lt]: lastId };
    }

    try {
      const userList = await User.findAll({
        where: lastId === -1 ? {} : where,
        limit: 5,
        attributes: ['id', 'img', 'name'],
        order: [['id', 'DESC']],
        include: [
          {
            model: Service,
            where: {
              pray: { [Op.ne]: false },
              TeamId: teamId,
            },
            attributes: [],
          },
        ],
      });
      const filteredPrayList = [...userList];
      for (let i = 0; i < userList.length; i++) {
        const prayList = await Pray.findAll({
          where: {
            UserId: userList[i].id,
            TeamId: teamId,
            weekend: { [Op.eq]: weekend },
          },
        });
        filteredPrayList[i].dataValues.Prays = prayList?.length ? prayList : [];
      }

      if (filteredPrayList.length === 5) {
        return res.status(200).json({
          code: 'OK',
          payload: filteredPrayList,
          message: `동아리 번호 ${teamId}의 ${weekend} 기간의 기도제목 목록입니다.`,
        });
      } else {
        console.log(filteredPrayList);
        return res.json({
          code: 'OK-LAST',
          payload: filteredPrayList,
          message: `동아리 번호 ${teamId}의 ${weekend} 기간의 마지막 기도제목 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post('/', async (req: any, res: Response, next: NextFunction) => {
  const { content: pureContent, userId, teamId } = req.body;
  const content = sanitizeHtml(pureContent);

  try {
    const user: any = await User.findOne({
      where: { id: userId },
      include: [
        { model: Service, where: { pray: { [Op.ne]: false }, TeamId: teamId } },
      ],
    });
    if (!user) {
      return res.status(403).json({
        code: 'Forbidden',
        msg: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
      });
    }

    const pray: any = await Pray.create({
      UserId: user.id,
      TeamId: teamId,
      weekend: date.thisWeekendToString(),
      content,
    });

    return res.status(200).json({
      code: 'OK',
      message:
        '형제자매님의 기도제목이 성공적으로 db에 저장되었으니 기도해주세요.',
      payload: {
        id: pray.id,
        weekend: pray.weekend,
        content: pray.content,
      },
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
});

router.patch('/', async (req: any, res: Response, next: NextFunction) => {
  const { id, content: pureContent, userId, teamId } = req.body;
  const content = sanitizeHtml(pureContent);

  try {
    const user: any = await User.findOne({
      where: { id: userId },
      include: [
        { model: Service, where: { pray: { [Op.ne]: false }, TeamId: teamId } },
      ],
    });

    if (!user) {
      return res.status(403).json({
        code: 'Forbidden',
        msg: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
      });
    }
    await Pray.update({ content }, { where: { id, TeamId: teamId } });
    return res.status(200).send({
      code: 'OK',
      msg: '유저의 기도제목이 성공적으로 변경되었습니다.',
    });
  } catch (e) {
    next(e);
  }
});

router.delete(
  '/:id/team/:teamId',
  async (req: any, res: Response, next: NextFunction) => {
    const { id, teamId } = req.params;
    try {
      await Pray.destroy({ where: { id, TeamId: teamId } });
      return res.status(200).json({
        code: 'OK',
        msg: '해당 기도제목의 삭제가 완료되었습니다!',
      });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

export default router;
