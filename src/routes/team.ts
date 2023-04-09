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
  // limits: { fileSize: 125 * 1024 * 1024 },
});

router.get('/:id', async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const team = await Team.findOne({ where: { id } });
    return res.status(200).json({
      code: 'OK',
      message: '팀 정보입니다.',
      payload: team,
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  '/:id/service',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const service = await Service.findOne({
        where: { TeamId: id, UserId: req.id },
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
  '/:id/service',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id, tweet, penalty, pray } = req.body;

      const service = await Service.findOne({ where: { id } });
      if (service) {
        await Service.update({ tweet, penalty, pray }, { where: { id } });

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
    console.log('what!');

    try {
      const { name, introducing } = req.body;

      const img = req.file?.path || ('' as string);
      console.log(name, introducing, img);
      if (!img) {
        return res
          .status(400)
          .json({ message: '잘못된 형식의 data입니다.', code: 'Bad Request' });
      }

      const team = await Team.create({
        UserId: req.id,
        bossId: req.id,
        name,
        img: img && img.replace('uploads', 'img'),
        introducing,
      });

      const user: any = await User.findOne({ where: { id: req.id } });

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
  async (req: any, res: Response, next: NextFunction) => {
    const { userId, teamId } = req.body;
    try {
      const alreadyInvitation = await Invitation.findOne({
        where: {
          UserId: userId,
          TeamId: teamId,
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
        TeamId: teamId,
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

      return res.status(201).send({
        code: 'Created',
        message: '초대가 성공적으로 완료되었습니다.',
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.post(
  '/application/approve',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id: stringId, teamId: stringTeamId } = req.body;
      const id = parseInt(stringId, 10);
      const teamId = parseInt(stringTeamId, 10);

      //boss에 대한 검증이 필요

      const application: any = await Invitation.findOne({ where: { id } });

      const team: any = await Team.findOne({
        where: { id: application.TeamId },
      });

      await team.addUser(application.UserId);

      await Invitation.destroy({ where: { id } });

      return res.status(201).json({
        code: 'Created',
        message: `${req.name}님의 가입 신청을 수락하셨습니다.`,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
);

router.get(
  '/:id/application/:lastId',
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: stringLastId, id: stringId } = req.params;
    const lastId = parseInt(stringLastId, 10);
    const id = parseInt(stringId, 10);
    let where: any = { TeamId: id, active: false };

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
  '/:id/invitation/:lastId',
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: stringLastId, id: stringId } = req.params;

    const lastId = parseInt(stringLastId, 10);
    const id = parseInt(stringId, 10);
    try {
      const invitations = await Invitation.findAll({
        where:
          lastId !== -1
            ? { TeamId: id, id: { [Op.lt]: lastId }, active: true }
            : { TeamId: id, active: true },
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
  '/:id/mates/:lastId',
  async (req: any, res: Response, next: NextFunction) => {
    const { lastId: stringLastId, id: stringId } = req.params;

    const lastId = parseInt(stringLastId, 10);
    const id = parseInt(stringId, 10);

    console.log(lastId, id);
    try {
      const team: any = await Team.findOne({ where: { id } });

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
  '',
  upload.single('img'),
  async (req: any, res: Response, next: NextFunction) => {
    const { name, introducing, id } = req.body;
    const img = req.file?.path || ('' as string);

    try {
      const team: any = await Team.findOne({
        where: { id },
      });

      if (req.id !== team.bossId) {
        return res.status(403).json({
          code: 'Forbidden',
          message: '권한이 없습니다.',
        });
      }

      let error = false;
      if (img.length !== 0) {
        fs.unlink(team.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('삭제완료')
        );

        if (error) {
          return res
            .status(500)
            .json({ message: '서버에러입니다.', code: 'Delete Error' });
        }
        await Team.update(
          { introducing, name, img: img.replace('uploads', 'img') },
          { where: { id } }
        );
        return res.status(200).send({
          code: 'OK',
          message: '팀의 정보가 성공적으로 변경되었습니다.',
        });
      } else {
        await Team.update({ introducing, name }, { where: { id } });
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

router.delete('/:id', async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const team: any = await Team.findOne({
      where: { id },
    });
    if (req.id !== team.bossId) {
      return res.status(403).json({
        code: 'Forbidden',
        message: '권한이 없습니다.',
      });
    }

    const tweets = await Tweet.findAll({
      where: { TeamId: id },
    });

    let error = false;
    tweets.map((tweet: any) => {
      fs.unlink(tweet.img.replace('img', 'uploads'), (err) =>
        err ? (error = true) : console.log('삭제완료')
      );
    });

    if (error) {
      return res
        .status(500)
        .json({ message: '서버에러입니다.', code: 'Delete Error' });
    }

    await Team.destroy({ where: { id } });

    await Service.destroy({ where: { TeamId: id } });
    await Invitation.destroy({ where: { TeamId: id } });
    await Tweet.destroy({ where: { TeamId: id } });
    await Penalty.destroy({ where: { TeamId: id } });
    await Pray.destroy({ where: { TeamId: id } });

    return res.status(200).json({
      code: 'OK',
      message: '동아리가 성공적으로 삭제 되었습니다.',
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.delete(
  '/invitation/:id',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await Invitation.destroy({ where: { id } });
      return res.status(200).json({
        code: 'OK',
        message: '초대가 성공적으로 취소되었습니다',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:teamId/dropout/:userId',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      //boss 검증로직 필요 req.id

      const { userId: stringId, teamId: stringTeamId } = req.params;

      const userId = parseInt(stringId, 10);
      const teamId = parseInt(stringTeamId, 10);
      const tweets = await Tweet.findAll({
        where: { UserId: userId, TeamId: teamId },
      });

      let error = false;
      tweets.map((tweet: any) => {
        fs.unlink(tweet.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('삭제완료')
        );
      });
      if (error) {
        return res
          .status(500)
          .json({ message: '서버에러입니다.', code: 'Delete Error' });
      }

      const team: any = await Team.findOne({ where: { id: teamId } });

      await team.removeUser(userId);

      await Tweet.destroy({
        where: {
          UserId: userId,
          TeamId: teamId,
        },
      });

      await Penalty.destroy({
        where: {
          UserId: userId,
          TeamId: teamId,
        },
      });

      await Pray.destroy({
        where: {
          UserId: userId,
          TeamId: teamId,
        },
      });

      await Service.destroy({
        where: {
          UserId: userId,
          TeamId: teamId,
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
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { teamId: stringTeamId } = req.params;
      const teamId = parseInt(stringTeamId, 10);

      const tweets = await Tweet.findAll({
        where: { UserId: req.id, TeamId: teamId },
      });
      let error = false;
      tweets.map((tweet: any) => {
        fs.unlink(tweet.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('삭제완료')
        );
      });

      if (error) {
        return res
          .status(500)
          .json({ message: '서버에러입니다.', code: 'Delete Error' });
      }

      const user: any = await User.findOne({ where: { id: req.id } });
      await user.removeTeam(teamId);

      await Tweet.destroy({
        where: {
          UserId: req.id,
          TeamId: teamId,
        },
      });

      await Penalty.destroy({
        where: {
          UserId: req.id,
          TeamId: teamId,
        },
      });

      await Pray.destroy({
        where: {
          UserId: req.id,
          TeamId: teamId,
        },
      });

      await Service.destroy({
        where: {
          UserId: req.id,
          TeamId: teamId,
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
