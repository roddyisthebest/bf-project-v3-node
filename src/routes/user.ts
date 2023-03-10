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

      let accessToken = token.generateAccessToken(user.id);
      let refreshToken = token.generateRefreshToken(user.id);

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
  'signin',
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
          let accessToken = token.generateAccessToken(exUser.id);
          let refreshToken = token.generateRefreshToken(exUser.id);
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
        const accessToken = token.generateAccessToken(exUser.id);
        const refreshToken = token.generateRefreshToken(exUser.id);

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
      const accessToken = token.generateAccessToken(newUser.id);
      const refreshToken = token.generateRefreshToken(newUser.id);
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
  '/',
  authToken,
  authUser,
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

router.put(
  '/service',
  authToken,
  authUser,
  async (req: any, res: Response, next: NextFunction) => {
    const {
      tweet,
      pray,
      penalty,
      teamId,
    }: { tweet: boolean; pray: boolean; penalty: boolean; teamId: number } =
      req.body;
    try {
      await Service.update(
        { tweet, pray, penalty },
        { where: { UserId: req.id, TeamId: teamId } }
      );
      return res.json({
        message: '서비스 사용설정이 완료되었습니다!',
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
    const { teamId, payed }: { teamId: number; payed: boolean } = req.body;
    try {
      // const user = await User.findAll({
      //   include: {
      //     model: Team,
      //     as: 'teams',
      //   },
      // });
      await Penalty.update(
        { payed },
        {
          where: {
            UserId: req.id,
            TeamId: teamId,
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

        if (penaltys.length === 5) {
          return res.status(200).json({
            code: 'OK',
            payload: penaltys,
            message: `회원번호 ${req.id} 유저의 트윗 목록입니다.`,
          });
        } else {
          return res.status(200).json({
            code: 'OK-LAST',
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
      if (lastId && lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const tweets = await Tweet.findAll({
        where: lastId === -1 ? { UserId: req.id, TeamId: teamId } : where,
        limit: 5,
        include: [
          {
            model: User,
            attributes: ['id', 'img', 'name', 'oauth', 'createdAt'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (tweets.length === 5) {
        return res.json({
          code: 'OK',
          payload: tweets,
          message: `회원번호 ${req.id} 유저의 트윗 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK-LAST',
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
        order: [['createdAt', 'DESC']],
      });

      if (prays.length === 5) {
        return res.json({
          code: 'OK',
          payload: prays,
          message: `회원번호 ${req.id} 유저의 기도제목 목록입니다.`,
        });
      } else {
        return res.json({
          code: 'OK-LAST',
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

export default router;
