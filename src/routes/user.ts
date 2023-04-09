import express, { Response, NextFunction, Request } from 'express';
import { Op } from 'sequelize';
import { User } from '../model/user';
import bcrypt from 'bcrypt';
import md5 from 'md5';
import token from '../util/token';
import authToken from '../middleware/authToken';
import authUser from '../middleware/authUser';
import { Service } from '../model/service';
import { Penalty } from '../model/penalty';
import date from '../util/date';
import { Tweet } from '../model/tweet';
import { Pray } from '../model/pray';
import { Team } from '../model/team';
import sanitize from 'sanitize-html';
import { Invitation } from '../model/invitation';
const router = express.Router();

router.post(
  '/signup',
  async (req: Request, res: Response, next: NextFunction) => {
    const { uid, password, name } = req.body;

    try {
      const exUser = await User.findOne({
        where: {
          [Op.or]: [{ uid }, { name }],
        },
      });
      if (exUser) {
        return res.status(409).json({
          code: 'Conflict',
          message: '이미 회원가입 되었거나 이름이 중복된 유저가 존재합니다.',
        });
      }

      const hash = await bcrypt.hash(password, 12);
      const user = await User.create({
        uid,
        password: hash,
        name,
        img: `https://s.gravatar.com/avatar/${md5(uid)}?s=32&d=retro`,
        oauth: 'local',
      });

      let accessToken = token.generateAccessToken(user.id, user.name);
      let refreshToken = token.generateRefreshToken(user.id, user.name);

      return res.status(201).json({
        message: `${user.name}님 성공적으로 회원등록 되었습니다.`,
        payload: {
          token: {
            accessToken,
            refreshToken,
          },
          userInfo: {
            ...user.dataValues,
          },
        },
        code: 'Created',
      });
    } catch (e) {
      return next(e);
    }
  }
);

router.post(
  '/signin',
  async (req: Request, res: Response, next: NextFunction) => {
    const { uid, password } = req.body;
    try {
      const exUser = await User.findOne({
        where: { uid },
      });
      if (exUser) {
        const result = await bcrypt.compare(password, exUser.password);
        if (result) {
          exUser.dataValues.password = null;
          let accessToken = token.generateAccessToken(exUser.id, exUser.name);
          let refreshToken = token.generateRefreshToken(exUser.id, exUser.name);
          return res.status(200).json({
            message: `${exUser.name}님 안녕하세요!`,
            payload: {
              token: {
                accessToken,
                refreshToken,
              },
              userInfo: {
                ...exUser.dataValues,
              },
            },
            code: 'OK',
          });
        } else {
          return res.status(400).json({
            code: 'Bad Request',
            message: '올바르지 않은 비밀번호입니다.',
          });
        }
      } else {
        return res.status(400).json({
          code: 'Bad Request',
          message: '가입되지 않은 회원입니다.',
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/login/sns',
  async (req: Request, res: Response, next: NextFunction) => {
    const { uid, name, img, oauth } = req.body;
    try {
      const exUser: any = await User.findOne({
        where: { uid, oauth },
      });
      if (exUser) {
        console.log(exUser.id);
        const accessToken = token.generateAccessToken(exUser.id, exUser.name);
        const refreshToken = token.generateRefreshToken(exUser.id, exUser.name);

        return res.status(200).json({
          message: `${exUser.name}님 안녕하세요!`,
          payload: {
            token: {
              accessToken,
              refreshToken,
            },
            userInfo: {
              ...exUser.dataValues,
            },
          },
          code: 'OK',
        });
      }
      const newUser = await User.create({
        uid,
        name,
        img: img
          ? img
          : `https://s.gravatar.com/avatar/${md5(uid)}?s=32&d=retro`,
        oauth,
      });
      const accessToken = token.generateAccessToken(newUser.id, newUser.name);
      const refreshToken = token.generateRefreshToken(newUser.id, newUser.name);
      return res.status(201).json({
        message: `${newUser.name}님 ${oauth}를 통한 가입을 축하합니다.`,
        payload: {
          token: {
            accessToken,
            refreshToken,
          },
          userInfo: {
            ...newUser.dataValues,
          },
        },
        code: 'Created',
      });
    } catch (e) {
      console.log(e);
    }
  }
);

router.patch(
  '',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    const { name, img } = req.body;
    try {
      await User.update({ name, img }, { where: { id: req.id } });
      res.status(200).json({
        message: '성공적으로 회원님의 정보가 바뀌었습니다.',
        code: 'OK',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/service/team/:teamId',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    const { teamId } = req.params;

    try {
      const alreadyService = await Service.findOne({
        where: { TeamId: teamId, UserId: req.id },
      });
      if (alreadyService) {
        return res.status(200).json({
          code: 'OK',
          message: `동아리 번호${teamId}의 서비스 사용 설정값 입니다.`,
          payload: alreadyService,
        });
      }
      return res.status(404).json({
        code: 'Not found',
        message: `동아리 번호${teamId}의 서비스 사용 설정값이 없습니다.`,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/service',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    const {
      tweet,
      pray,
      penalty,
      teamId,
    }: { tweet: boolean; pray: boolean; penalty: boolean; teamId: number } =
      req.body;
    try {
      const alreadyService = await Service.findOne({
        where: { TeamId: teamId, UserId: req.id },
      });

      if (alreadyService) {
        return res.status(409).json({
          code: 'Conflict',
          message: '이미 서비스 사용 설정이 초기화 되었습니다.',
        });
      }

      await Service.create({
        tweet,
        pray,
        penalty,
        TeamId: teamId,
        UserId: req.id,
      });
      return res.json({
        message: `동아리 번호${teamId}의 서비스 사용 설정이 초기화 되었습니다.`,
        code: 'OK',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/paycheck',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    const { id, payed }: { id: number; payed: boolean } = req.body;
    try {
      await Penalty.update(
        { payed },
        {
          where: {
            id,
            weekend: date.thisWeekendToString(),
          },
        }
      );

      return res.status(200).json({
        code: 'OK',
        message: `(${date.thisWeekendToString()}) 유저의 벌금 제출값이 성공적으로 변경되었습니다.`,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/phoneToken',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { phoneToken }: { phoneToken: string } = req.body;
      await User.update({ phoneToken }, { where: { id: req.id } });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/team/:teamId/penaltys/:lastId',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { lastId: lstId, teamId } = req.params;
      try {
        const where = { id: {}, UserId: req.id, TeamId: teamId };
        const lastId = parseInt(lstId, 10);
        if (lastId && lastId !== -1) {
          where.id = { [Op.lt]: lastId };
        }

        const penaltys = await Penalty.findAll({
          where: lastId === -1 ? { UserId: req.id, TeamId: teamId } : where,
          limit: 10,
          order: [['id', 'DESC']],
        });

        if (penaltys.length === 10) {
          return res.status(200).json({
            code: 'OK',
            payload: penaltys,
            message: `회원번호 ${req.id} 유저의 트윗 목록입니다.`,
          });
        } else {
          return res.status(200).json({
            code: 'OK:LAST',
            payload: penaltys,
            message: `회원번호 ${req.id} 유저의 마지막 페이지 트윗 목록입니다.`,
          });
        }
      } catch (e) {
        console.error(e);
        next(e);
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/team/:teamId/tweets/:lastId',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: lstId, teamId } = req.params;
    const lastId = parseInt(lstId, 10);

    try {
      const where = { id: {}, UserId: req.id, TeamId: teamId };
      if (lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }
      console.log(where);

      const tweets = await Tweet.findAll({
        where: lastId === -1 ? { UserId: req.id, TeamId: teamId } : where,
        limit: 5,
        include: [
          {
            model: User,
            attributes: ['id', 'img', 'name', 'oauth', 'createdAt'],
          },
        ],
        order: [['id', 'DESC']],
      });

      if (tweets.length === 5) {
        return res.json({
          code: 'OK',
          payload: tweets,
          message: `회원번호 ${req.id} 유저의 트윗 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: tweets,
          message: `회원번호 ${req.id} 유저의 마지막 페이지 트윗 목록입니다.`,
        });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.get(
  '/team/:teamId/prays/:lastId',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: lstId, teamId } = req.params;
    const lastId = parseInt(lstId, 10);
    try {
      const where = { id: {}, UserId: req.id, TeamId: teamId };
      if (lastId && lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const prays = await Pray.findAll({
        where: lastId === -1 ? { UserId: req.id, TeamId: teamId } : where,
        limit: 15,
        order: [['id', 'DESC']],
      });

      if (prays.length === 15) {
        return res.json({
          code: 'OK',
          payload: prays,
          message: `회원번호 ${req.id} 유저의 기도제목 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: prays,
          message: `회원번호 ${req.id} 유저의 마지막 페이지 기도제목 목록입니다.`,
        });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.get(
  '/team/thumbnail',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const user: any = await User.findOne({ where: { id: req.id } });

      const payload = await user.getTeams({
        limit: 5,
        order: [['createdAt', 'DESC']],
      });
      return res.json({
        code: 'OK',
        payload,
        message: `${req.name}님이 가입한 팀의 썸네일 목록입니다.`,
      });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.get(
  '/team/lastId/:lastId',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { lastId: stringLastId } = req.params;
      const lastId = parseInt(stringLastId, 10);

      let where: any = {};
      if (lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const user: any = await User.findOne({ where: { id: req.id } });

      const teams = await user.getTeams({
        where,
        limit: 15,
        order: [['createdAt', 'DESC']],
      });

      if (teams.length === 15) {
        return res.json({
          code: 'OK',
          payload: teams,
          message: `${req.name}님이 가입한 팀 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: teams,
          message: `${req.name}님이 가입한 마지막 팀 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/invitation/:lastId',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { lastId: stringLastId } = req.params;
      const lastId = parseInt(stringLastId, 10);

      const invitations = await Invitation.findAll({
        where:
          lastId !== -1
            ? { UserId: req.id, id: { [Op.lt]: lastId }, active: true }
            : { UserId: req.id, active: true },

        limit: 15,
        order: [['createdAt', 'DESC']],
        include: [{ model: Team, attributes: ['id', 'name', 'img'] }],
      });

      if (invitations.length === 15) {
        return res.json({
          code: 'OK',
          payload: invitations,
          message: '유저가 받은 초대 목록입니다.',
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: invitations,
          message: `유저가 받은 초대 마지막 목록입니다.`,
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/application/:lastId',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { lastId: stringLastId } = req.params;
      const lastId = parseInt(stringLastId, 10);
      const applications = await Invitation.findAll({
        where:
          lastId !== -1
            ? { UserId: req.id, id: { [Op.lt]: lastId }, active: false }
            : { UserId: req.id, active: false },
        limit: 15,
        order: [['createdAt', 'DESC']],
        include: [{ model: Team, attributes: ['id', 'name', 'img'] }],
      });
      if (applications.length === 15) {
        return res.json({
          code: 'OK',
          payload: applications,
          message: '유저가 신청한 팀 목록입니다.',
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: applications,
          message: '유저가 신청한 팀 마지막 목록입니다.',
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);
router.get(
  '/invitation/thumbnail/:active',
  authToken,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { active } = req.params;
      const invitations = await Invitation.findAll({
        where: { UserId: req.id, active: active === 'true' ? true : false },
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [
          { model: Team, attributes: ['id', 'name', 'img', 'introducing'] },
        ],
      });

      return res.json({
        code: 'OK',
        payload: invitations,
        message: active
          ? '유저가 받은 초대 썸네일 목록 입니다.'
          : '가입 신청한 팀 썸네일 목록입니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

export default router;
