import express, { Response, NextFunction } from 'express';
import { User } from '../model/user';
import { Op } from 'sequelize';
import moment from 'moment';
import { Pray } from '../model/pray';
import sanitizeHtml from 'sanitize-html';
import { Service } from '../model/service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Team } from '../model/team';
import { Invitation } from '../model/invitation';
import { Tweet } from '../model/tweet';
import { Penalty } from '../model/penalty';
import authTeam from '../middleware/authTeam';
import authBoss from '../middleware/authBoss';
import admin from 'firebase-admin';
import date from '../util/date';

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, `src/uploads`);
    },
    filename(req, file, cb) {
      console.log(file);
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get(
  '/:teamId',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const team = await Team.findOne({ where: { id: req.team.id } });
      return res.status(200).json({
        code: 'OK',
        message: '팀 정보입니다.',
        payload: team,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:teamId/service',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const service = await Service.findOne({
        where: { TeamId: req.team.id, UserId: req.id },
      });
      if (service) {
        return res.status(200).json({
          code: 'OK',
          message: '서비스 이용 정보 입니다.',
          payload: service,
        });
      }
      return res.status(404).json({
        code: 'Not Found',
        message: '서비스 이용 정보가 없습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.put(
  '/:teamId/service',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id, tweet, penalty, pray } = req.body;

      const service = await Service.findOne({ where: { id } });
      if (service) {
        await Service.update({ tweet, penalty, pray }, { where: { id } });

        if (penalty) {
          const penaltyRc = await Penalty.findOne({
            where: {
              TeamId: req.team.id,
              UserId: req.id,
              weekend: date.thisWeekendToString(),
            },
          });
          if (!penaltyRc) {
            await Penalty.create({
              weekend: date.thisWeekendToString(),
              UserId: req.id,
              TeamId: req.team.id,
            });
          }
        }
        return res.status(200).json({
          code: 'OK',
          message: '서비스 이용 정보가 수정되었습니다.',
        });
      }

      return res.status(404).json({
        code: 'Not Found',
        message: '서비스 이용 정보가 없습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '',
  upload.single('img'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { name, introducing } = req.body;

      const img = req.file?.path || ('' as string);
      console.log(name, introducing, img);
      if (!img) {
        return res
          .status(400)
          .json({ message: '잘못된 형식의 data입니다.', code: 'Bad Request' });
      }

      const user: any = await User.findOne({ where: { id: req.id } });

      const teams = await user.getTeams({ where: { bossId: req.id } });

      let error = false;
      if (teams.length === 3) {
        fs.rm(img, (err) => (err ? (error = true) : (error = false)));
        if (error) {
          return res
            .status(500)
            .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
        } else {
          return res.status(403).json({
            code: 'Forbidden:ExceededTeam',
            message: '팀 최대 생성 횟수를 초과했습니다.',
          });
        }
      }

      const team = await Team.create({
        UserId: req.id,
        bossId: req.id,
        name,
        img: img && img.replace('uploads', 'img'),
        introducing,
      });

      await user.addTeam(parseInt(team.id, 10));

      return res.status(201).json({
        code: 'Created',
        message: `성공적으로 팀 ${name}이 생성되었습니다.`,
        payload: {
          bossId: req.id,
          name,
          img: img && img.replace('uploads', 'img'),
          introducing,
        },
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '/invitation',
  authTeam,
  authBoss,
  async (req: any, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    try {
      const team: any = await Team.findOne({ where: { id: req.team.id } });

      const join = await team.getUsers({
        where: { id: userId },
      });
      console.log(join);

      if (join.length !== 0) {
        return res.status(409).json({
          code: 'Conflict',
          message: '이미 가입된 회원입니다.',
        });
      }

      const alreadyInvitation = await Invitation.findOne({
        where: {
          UserId: userId,
          TeamId: req.team.id,
        },
      });
      if (alreadyInvitation) {
        return res.status(409).json({
          code: 'Conflict',
          message: '이미 초대한 회원입니다.',
        });
      }
      await Invitation.create({
        UserId: userId,
        TeamId: req.team.id,
      });

      const user: any = await User.findOne({
        where: { id: userId },
      });

      await admin.messaging().send({
        token: user.phoneToken,
        data: {
          code: 'invitation:post',
        },
        notification: {
          title: '회원 초대 💌',
          body: `${user.name}님! 팀 ${team.name}이 팀 초대장을 보냈어요.`,
        },
        android: {
          notification: {
            channelId: 'join',
            vibrateTimingsMillis: [0, 500, 500, 500],
            priority: 'high',
            defaultVibrateTimings: false,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              category: 'default',
              threadId: 'join',
            },
          },
        },
      });

      return res.status(201).send({
        code: 'Created',
        message: '초대가 성공적으로 완료되었습니다.',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/invitation/approve',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id: stringId } = req.body;

      const id = parseInt(stringId, 10);
      const invitations = await Invitation.findAll({
        where: { UserId: req.id, active: true },
      });

      if (
        invitations.length === 0 ||
        !invitations.some((invitation) => invitation.id === id)
      ) {
        return res.status(403).json({
          code: 'Forbidden',
          message: '잘못된 접근입니다.',
        });
      }

      const invitation: any = await Invitation.findOne({ where: { id } });

      const team: any = await Team.findOne({
        where: { id: invitation.TeamId },
      });

      await team.addUser(req.id);

      await Invitation.destroy({ where: { id } });

      const boss: any = await User.findOne({
        where: { id: team.bossId },
      });

      await admin.messaging().send({
        token: boss.phoneToken,
        data: {
          code: 'invitation:approve',
        },

        notification: {
          title: '초대 수락🥰',
          body: `${boss.name}님! ${req.name}님이 팀 ${team.name}의 초대를 수락하였습니다.`,
        },
        android: {
          notification: {
            channelId: 'join',
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
              threadId: 'join',
            },
          },
        },
      });

      return res.status(201).json({
        code: 'Created',
        message: '팀의 초대 제안에 수락하였습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '/application',
  async (req: any, res: Response, next: NextFunction) => {
    const { teamId: stringId } = req.body;
    const teamId = parseInt(stringId, 10);

    try {
      const team: any = await Team.findOne({ where: { id: teamId } });

      const join = await team.getUsers({
        where: { id: req.id },
      });

      if (join.length !== 0) {
        return res.status(409).json({
          code: 'Conflict',
          message: '이미 가입된 회원입니다.',
        });
      }

      const alreadyApplication = await Invitation.findOne({
        where: {
          UserId: req.id,
          TeamId: teamId,
          active: false,
        },
      });
      if (alreadyApplication) {
        return res.status(409).json({
          code: 'Conflict',
          message: '이미 신청한 팀입니다.',
        });
      }
      await Invitation.create({
        UserId: req.id,
        TeamId: teamId,
        active: false,
      });

      const boss: any = await User.findOne({ where: { id: team.bossId } });

      await admin.messaging().send({
        token: boss.phoneToken,
        notification: {
          title: '가입신청📮',
          body: `${req.name}님이 팀 ${team.name}에 가입신청하였습니다.`,
        },
        android: {
          notification: {
            channelId: 'join',
            vibrateTimingsMillis: [0, 500, 500, 500],
            priority: 'high',
            defaultVibrateTimings: false,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              category: 'default',
              threadId: 'join',
            },
          },
        },
      });
      return res.status(201).send({
        code: 'Created',
        message: '가입신청이 성공적으로 완료되었습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '/application/approve',
  authTeam,
  authBoss,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id: stringId } = req.body;
      const id = parseInt(stringId, 10);

      const application: any = await Invitation.findOne({ where: { id } });

      if (application) {
        const team: any = await Team.findOne({
          where: { id: application.TeamId },
        });

        await team.addUser(application.UserId);

        await Invitation.destroy({ where: { id } });

        const user: any = await User.findOne({
          where: { id: application.UserId },
        });
        await admin.messaging().send({
          token: user.phoneToken,
          data: {
            code: 'application:approve',
          },
          notification: {
            title: '가입신청 수락',
            body: `${user.name}님! 팀 ${team.name}에 가입되었습니다.`,
          },
          android: {
            notification: {
              channelId: 'join',
              vibrateTimingsMillis: [0, 500, 500, 500],
              priority: 'high',
              defaultVibrateTimings: false,
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                category: 'default',
                threadId: 'join',
              },
            },
          },
        });

        return res.status(201).json({
          code: 'Created',
          message: `가입 신청을 수락하셨습니다.`,
        });
      }

      return res.status(404).json({
        code: 'Not Found',
        message: '유저가 가입신청을 이미 취소하였습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/:teamId/application/:lastId',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: stringLastId } = req.params;
    const lastId = parseInt(stringLastId, 10);
    let where: any = { TeamId: req.team.id, active: false };

    if (lastId !== -1) {
      where.id = { [Op.lt]: lastId };
    }

    try {
      const applications = await Invitation.findAll({
        where,
        limit: 15,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['id', 'name', 'img', 'oauth'] }],
      });

      if (applications.length === 15) {
        return res.json({
          code: 'OK',
          payload: applications,
          message: '팀에 가입 신청한 유저들의 목록입니다.',
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: applications,
          message: `팀에 가입 신청한 유저들의 마지막 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/:teamId/invitation/:lastId',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: stringLastId } = req.params;

    const lastId = parseInt(stringLastId, 10);
    try {
      const invitations = await Invitation.findAll({
        where:
          lastId !== -1
            ? { TeamId: req.team.id, id: { [Op.lt]: lastId }, active: true }
            : { TeamId: req.team.id, active: true },
        limit: 15,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['id', 'name', 'img', 'oauth'] }],
      });

      if (invitations.length === 15) {
        return res.json({
          code: 'OK',
          payload: invitations,
          message: '팀의 초대유저 목록입니다.',
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: invitations,
          message: `팀의 초대유저 마지막 목록입니다.`,
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:teamId/mates/:lastId',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: stringLastId } = req.params;

    const lastId = parseInt(stringLastId, 10);

    try {
      const team: any = await Team.findOne({ where: { id: req.team.id } });

      const payload = await team.getUsers({
        limit: 15,
        where: lastId === -1 ? {} : { id: { [Op.lt]: lastId } },
      });

      if (payload?.length === 15) {
        return res.json({
          code: 'OK',
          payload,
          message: '팀원 목록입니다.',
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload,
          message: `팀원 마지막 목록입니다.`,
        });
      }
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.put(
  '/:teamId',
  authTeam,
  authBoss,
  upload.single('img'),
  async (req: any, res: Response, next: NextFunction) => {
    console.log('편집으로 왔뎌');
    const { name, introducing } = req.body;
    const img = req.file?.path || ('' as string);

    try {
      let error = false;
      if (img.length !== 0) {
        fs.rm(req.team.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('삭제완료')
        );

        if (error) {
          return res
            .status(500)
            .json({ message: '서버에러입니다.', code: 'Delete Error' });
        }
        await Team.update(
          { introducing, name, img: img.replace('uploads', 'img') },
          { where: { id: req.team.id } }
        );
        return res.status(200).send({
          code: 'OK',
          message: '팀의 정보가 성공적으로 변경되었습니다.',
        });
      } else {
        await Team.update(
          { introducing, name },
          { where: { id: req.team.id } }
        );
        return res.status(200).send({
          code: 'OK',
          message: '팀의 정보가 성공적으로 변경되었습니다.',
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:teamId',
  authTeam,
  authBoss,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const tweets = await Tweet.findAll({
        where: { TeamId: req.team.id },
      });

      let error = false;
      tweets.map((tweet: any) => {
        fs.rm(tweet.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('삭제완료')
        );
      });

      let teamImageError = false;

      fs.rm(req.team.img.replace('img', 'uploads'), (err) =>
        err ? (teamImageError = true) : (teamImageError = false)
      );

      if (error || teamImageError) {
        return res
          .status(500)
          .json({ message: '서버에러입니다.', code: 'Delete Error' });
      }

      await Team.destroy({ where: { id: req.team.id } });

      await Service.destroy({ where: { TeamId: req.team.id } });
      await Invitation.destroy({ where: { TeamId: req.team.id } });
      await Tweet.destroy({ where: { TeamId: req.team.id } });
      await Penalty.destroy({ where: { TeamId: req.team.id } });
      await Pray.destroy({ where: { TeamId: req.team.id } });

      return res.status(200).json({
        code: 'OK',
        message: '동아리가 성공적으로 삭제 되었습니다.',
      });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.delete(
  '/:teamId/invitation/:id',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const invitation: any = await Invitation.findOne({ where: { id } });

      if (invitation) {
        const team: any = await Team.findOne({
          where: { id: invitation.TeamId },
        });
        const boss: any = await User.findOne({
          where: { id: team.bossId },
        });

        if (boss.id !== req.id) {
          await admin.messaging().send({
            token: boss.phoneToken,
            data: {
              code: 'invitation:delete',
            },

            notification: {
              title: '초대 거절😢',
              body: `${boss.name}님! ${req.name}님이 팀 ${team.name}의 초대를 거절하였습니다.`,
            },
            android: {
              notification: {
                channelId: 'join',
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
                  threadId: 'join',
                },
              },
            },
          });
        }
        await Invitation.destroy({ where: { id } });
        return res.status(200).json({
          code: 'OK',
          message: '초대가 성공적으로 취소되었습니다',
        });
      }

      return res.status(403).json({
        code: 'Forbidden',
        message: '취소처리된 초대장입니다.',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:teamId/application/:id',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const invitation: any = await Invitation.findOne({ where: { id } });

      if (invitation) {
        const team: any = await Team.findOne({
          where: { id: invitation.TeamId },
        });
        const boss: any = await User.findOne({
          where: { id: team.bossId },
        });
        const user: any = await User.findOne({
          where: { id: invitation.UserId },
        });
        await Invitation.destroy({ where: { id } });
        if (req.id === boss.id) {
          await admin.messaging().send({
            token: user.phoneToken,
            data: {
              code: 'application:delete',
            },
            notification: {
              title: '가입 신청 거부',
              body: `${user.name}님! 팀 ${team.name} 가입신청이 거부당하였습니다. `,
            },
            android: {
              notification: {
                channelId: 'join',
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
                  threadId: 'join',
                },
              },
            },
          });
        }

        return res.status(200).json({
          code: 'OK',
          message: '가입 신청이 성공적으로 취소되었습니다',
        });
      }
      return res.status(403).json({
        code: 'Forbidden',
        message: '이미 취소처리된 가입신청입니다.',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:teamId/dropout/:userId',
  authTeam,
  authBoss,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { userId: stringId } = req.params;

      const userId = parseInt(stringId, 10);

      const team: any = await Team.findOne({ where: { id: req.team.id } });

      const join = await team.getUsers({ where: { id: userId } });

      if (join.length === 0) {
        return res.status(409).json({
          code: 'Conflict',
          message: '가입되지 않은 회원입니다.',
        });
      }

      const tweets = await Tweet.findAll({
        where: { UserId: userId, TeamId: req.team.id },
      });

      let error = false;
      tweets.map((tweet: any) => {
        fs.rm(tweet.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('삭제완료')
        );
      });
      if (error) {
        return res
          .status(500)
          .json({ message: '서버에러입니다.', code: 'Delete Error' });
      }

      await team.removeUser(userId);

      await Tweet.destroy({
        where: {
          UserId: userId,
          TeamId: req.team.id,
        },
      });

      await Penalty.destroy({
        where: {
          UserId: userId,
          TeamId: req.team.id,
        },
      });

      await Pray.destroy({
        where: {
          UserId: userId,
          TeamId: req.team.id,
        },
      });

      await Service.destroy({
        where: {
          UserId: userId,
          TeamId: req.team.id,
        },
      });
      const user: any = await User.findOne({ where: { id: userId } });
      await admin.messaging().send({
        token: user.phoneToken,
        data: {
          code: 'team:dropout',
          teamId: req.team.id.toString(),
        },
        notification: {
          title: '팀 강퇴',
          body: `${user.name}님! 팀 ${team.name}에서 강퇴되었습니다.`,
        },
        android: {
          notification: {
            channelId: 'join',
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
              threadId: 'join',
            },
          },
        },
      });

      return res.status(200).send({
        code: 'OK',
        message: '유저가 성공적으로 강퇴되었습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.delete(
  '/:teamId/withdraw',
  authTeam,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const tweets = await Tweet.findAll({
        where: { UserId: req.id, TeamId: req.team.id },
      });
      let error = false;
      tweets.map((tweet: any) => {
        fs.rm(tweet.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('삭제완료')
        );
      });

      if (error) {
        return res
          .status(500)
          .json({ message: '서버에러입니다.', code: 'Delete Error' });
      }

      const user: any = await User.findOne({ where: { id: req.id } });
      await user.removeTeam(req.team.id);

      await Tweet.destroy({
        where: {
          UserId: req.id,
          TeamId: req.team.id,
        },
      });

      await Penalty.destroy({
        where: {
          UserId: req.id,
          TeamId: req.team.id,
        },
      });

      await Pray.destroy({
        where: {
          UserId: req.id,
          TeamId: req.team.id,
        },
      });

      await Service.destroy({
        where: {
          UserId: req.id,
          TeamId: req.team.id,
        },
      });

      const boss: any = await User.findOne({ where: { id: req.team.bossId } });

      await admin.messaging().send({
        token: boss.phoneToken,
        data: {
          code: 'team:withdraw',
        },
        notification: {
          title: '팀 탈퇴',
          body: `팀 ${req.team.name}의 ${req.name}님이 탈퇴하였습니다.`,
        },
        android: {
          notification: {
            channelId: 'join',
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
              threadId: 'join',
            },
          },
        },
      });

      return res.status(200).send({
        code: 'OK',
        message: `${req.name}님 탈퇴가 성공적으로 이루어졌습니다.`,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

export default router;
