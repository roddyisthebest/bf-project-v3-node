import express, { Response, NextFunction } from 'express';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { Pray } from '../model/pray';
import sanitizeHtml from 'sanitize-html';
import { Service } from '../model/service';
import date from '../util/date';
import { Team } from '../model/team';
import authTeam from '../middleware/authTeam';
import admin from 'firebase-admin';

const router = express.Router();

router.get(
  '/:lastId/team/:teamId/weekend/:weekend',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    const { weekend } = req.params;
    console.log('we here');
    const where = { id: {}, TeamId: req.team.id };
    const lastId = parseInt(req.params.lastId, 10);
    if (lastId !== -1) {
      where.id = { [Op.lt]: lastId };
    }

    try {
      let arr: number[] = [];
      const team: any = await Team.findOne({ where: { id: req.team.id } });

      const userList = await team.getUsers({
        limit: 5,
        where: lastId === -1 ? {} : { id: { [Op.lt]: lastId } },
        order: [['id', 'DESC']],
        include: [
          {
            model: Service,
            where: { pray: { [Op.ne]: false }, TeamId: req.team.id },
          },
        ],
      });

      let filteredPrayList = [...userList];
      for (let i = 0; i < userList.length; i++) {
        const prayList = await Pray.findAll({
          where: {
            UserId: userList[i].id,
            TeamId: req.team.id,
            weekend: { [Op.eq]: weekend },
          },
        });

        if (prayList?.length === 0) {
          arr.push(filteredPrayList[i].id);
        } else {
          filteredPrayList[i].dataValues.Prays = prayList?.length
            ? prayList
            : [];
        }
      }

      if (filteredPrayList.length === 5) {
        return res.status(200).json({
          code: 'OK',
          payload: filteredPrayList,
          message: `동아리 ${req.team.name}의 ${weekend} 기간의 기도제목 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: filteredPrayList,
          message: `동아리 ${req.team.name}의 ${weekend} 기간의 마지막 기도제목 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    const { userId } = req.body;

    try {
      const user: any = await User.findOne({
        where: { id: userId },
        include: [
          {
            model: Service,
            where: { pray: { [Op.ne]: false }, TeamId: req.team.id },
          },
        ],
      });
      if (!user) {
        return res.status(403).json({
          code: 'Forbidden:Service',
          message: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
        });
      }

      const prayList = await Pray.findAll({
        where: {
          UserId: user.id,
          TeamId: req.team.id,
          weekend: date.thisWeekendToString(),
        },
      });

      if (prayList.length === 15) {
        return res.status(403).json({
          code: 'Forbidden:ExceededPray',
          message: '한주에 15개 이상 기도제목을 업로드 할 수 없습니다.',
        });
      }

      const pray: any = await Pray.create({
        UserId: user.id,
        TeamId: req.team.id,
        weekend: date.thisWeekendToString(),
        content: '',
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
  }
);

router.patch(
  '',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    const { id, content: pureContent } = req.body;
    const content = sanitizeHtml(pureContent);

    try {
      const user: any = await User.findOne({
        where: { id: req.id },
        include: [
          {
            model: Service,
            where: { pray: { [Op.ne]: false }, TeamId: req.team.id },
          },
        ],
      });

      if (!user) {
        return res.status(403).json({
          code: 'Forbidden',
          message: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
        });
      }

      const pray = await Pray.findOne({ where: { id } });
      if (!pray) {
        return res.status(404).json({
          code: 'Not Found',
          message: '삭제되었거나 없는 기도제목입니다.',
        });
      }
      await Pray.update({ content }, { where: { id, TeamId: req.team.id } });
      return res.status(200).send({
        code: 'OK',
        message: '유저의 기도제목이 성공적으로 변경되었습니다.',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/cheer',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { userId, anonymity } = req.body;
      const id = parseInt(userId, 10);
      console.log('anonymity', anonymity);
      const user = await req.team.getUsers({ where: { id } });
      if (user && user.length === 0) {
        return res.status(403).json({
          code: 'Forbidden',
          message: `${user[0].name}님은 팀 ${req.team.name}의 멤버가 아닙니다.`,
        });
      } else {
        await admin.messaging().send({
          token: user[0].phoneToken,
          notification: {
            title: '당신을 위한 기도 🙏🏻',
            body: anonymity
              ? `${user[0].name}님! 당신을 위해 누군가가 기도합니다.`
              : `${user[0].name}님! ${req.name}님이 당신을 위해 기도합니다. `,
          },
          android: {
            notification: {
              channelId: 'default',
              vibrateTimingsMillis: [0, 500, 500, 500],
              priority: 'default',
              defaultVibrateTimings: false,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                category: 'default',
              },
            },
          },
        });

        return res.json({
          code: 'OK',
          message: '성공적으로 응원이 전해졌습니다.',
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.delete(
  '/:id/team/:teamId',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const pray = await Pray.findOne({ where: { id } });
      if (!pray) {
        return res.status(404).json({
          code: 'Not Found',
          message: '삭제되었거나 없는 기도제목입니다.',
        });
      }
      await Pray.destroy({ where: { id, TeamId: req.team.id } });
      return res.status(200).json({
        code: 'OK',
        message: '해당 기도제목의 삭제가 완료되었습니다!',
      });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

export default router;
