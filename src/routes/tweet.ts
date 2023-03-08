import express, { Response, NextFunction } from 'express';
import { User } from '../model/user';
import { Op } from 'sequelize';

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';
import { Tweet } from '../model/tweet';
import userType from '../types/user';
import { Service } from '../model/service';
import date from '../util/date';
const router = express.Router();

try {
  fs.readdirSync('src/uploads');
} catch (error) {
  fs.mkdirSync('src/uploads');
}

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

router.post(
  '/',
  upload.single('img'),
  async (req: any, res: Response, next: NextFunction) => {
    const { teamId } = req.body;
    try {
      const user: any = await User.findOne({
        where: { id: req.id },
        include: [
          {
            model: Service,
            where: {
              TeamId: teamId,
            },
          },
        ],
      });

      const img = req.file?.path || ('' as string);
      const { content: pureContent } = req.body;
      const content = sanitizeHtml(pureContent);

      let error = false;

      if (!(img || content)) {
        return res
          .status(400)
          .json({ message: '잘못된 형식의 data입니다.', code: 'Bad Request' });
      }

      if (!user.Service.tweet) {
        fs.unlink(img, (err) => (err ? (error = true) : (error = false)));
        if (error) {
          return res
            .status(500)
            .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
        } else {
          return res.status(403).json({
            code: 'Forbidden',
            message: `${user.name}님은 게시글을 업로드하는 서비스를 이용하지 않으셨습니다.`,
          });
        }
      }

      const alreadyTweet = await Tweet.findOne({
        where: {
          UserId: req.id,
          TeamId: teamId,
          createdAt: {
            [Op.between]: [date.startOfToday(), date.endOfToday()],
          },
        },
      });

      if (alreadyTweet) {
        fs.unlink(img, (err) => (err ? (error = true) : (error = false)));
        if (error) {
          return res
            .status(500)
            .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
        } else {
          return res.status(406).json({
            code: 'Forbidden',
            message: '오늘 업로드 된 게시물이 존재합니다.',
          });
        }
      }

      await Tweet.create({
        UserId: req.id,
        TeamId: teamId,
        content: content && content,
        img: img && img.replace('uploads', 'img'),
        weekend: date.thisWeekendToString(),
      });

      return res.status(200).json({
        code: 'OK',
        message: '성공적으로 업로드 되었습니다.',
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/:lastId/team/:teamId',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const where = { id: {}, TeamId: req.params.teamId };
      const lastId = parseInt(req.params.lastId, 10);

      if (lastId !== -1) {
        where.id = { [Op.lt]: lastId };
      }

      const tweets = await Tweet.findAll({
        where: lastId === -1 ? { TeamId: req.params.teamId } : where,
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['id', 'name', 'img', 'oauth'] }],
      });
      if (tweets.length === 5) {
        return res.status(200).json({
          code: 'OK',
          payload: tweets,
          message: `동아리 번호 ${req.params.teamId}의 트윗 목록 입니다.`,
        });
      } else {
        return res.status(200).json({
          code: 'OK',
          payload: tweets,
          message: `동아리 번호 ${req.params.teamId}의 마지막 트윗 목록 입니다.`,
        });
      }
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
);

router.delete('/:id', async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const tweet: any = await Tweet.findOne({
      where: { id },
      include: [{ model: User, attributes: ['id'] }],
    });

    const user: userType = tweet?.User;

    var error = false;

    if (req.id === (user.id as number)) {
      await Tweet.destroy({ where: { id } });
      if (tweet.img.length != 0) {
        fs.unlink(tweet?.img.replace('img', 'uploads'), (err) =>
          err ? (error = true) : console.log('good')
        );
      }

      if (!error) {
        return res.status(200).json({
          code: '200',
          message: '해당 트윗의 삭제가 완료되었습니다!',
        });
      } else {
        return res.status(404).send({ code: 'Not Found', message: error });
      }
    } else {
      return res
        .status(403)
        .json({ code: 'Forbidden', message: '권한이 없습니다.' });
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});

export default router;
