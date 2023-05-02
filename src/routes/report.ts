import express, { Response, NextFunction, Request } from 'express';
import { Op } from 'sequelize';
import { Report } from '../model/report';
import authAdmin from '../middleware/authAdmin';
import { Tweet } from '../model/tweet';
import { Pray } from '../model/pray';
import fs from 'fs';
const router = express.Router();

router.get(
  '/:lastId',
  authAdmin,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { lastId } = req.params;
      let where: any = {};
      if (lastId !== -1) {
        where.id = {
          [Op.lt]: lastId,
        };
      }

      const reports = await Report.findAll({
        limit: 10,
        where,
        order: [['createdAt', 'DESC']],
      });

      if (reports.length === 10) {
        return res.json({
          code: 'OK',
          payload: reports,
          message: `신고 리스트들입니다.`,
        });
      } else {
        return res.json({
          code: 'OK:LAST',
          payload: reports,
          message: `마지막 신고 리스트들입니다.`,
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/tweet/:id',
  authAdmin,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const tweet = await Tweet.findOne({ where: { id: req.params.id } });

      if (tweet) {
        return res.status(200).json({
          code: 'OK',
          message: `게시글 정보입니다.`,
          payload: tweet,
        });
      } else {
        return res.status(404).json({
          code: 'Not Found',
          message: `게시글 정보가 없습니다.`,
          payload: tweet,
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  '/pray/:id',
  authAdmin,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const pray = await Pray.findOne({ where: { id: req.params.id } });

      if (pray) {
        return res.status(200).json({
          code: 'OK',
          message: `기도제목입니다.`,
          payload: pray,
        });
      } else {
        return res.status(404).json({
          code: 'Not Found',
          message: `기도제목이 없습니다.`,
          payload: pray,
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.post('', async (req: any, res: Response, next: NextFunction) => {
  try {
    const { content, model } = req.body;
    await Report.create({ content, model, UserId: req.id });
    return res.status(201).json({
      code: 'Created',
      message: '성공적으로 신고가 접수되었습니다.',
    });
  } catch (e) {
    next(e);
  }
});

router.delete(
  '/tweet/:id',
  authAdmin,
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const tweet: any = await Tweet.findOne({ where: { id: req.params.id } });

      if (tweet) {
        await Tweet.destroy({ where: { id: req.params.id } });

        let error = false;
        fs.rm(tweet?.img.replace('src/img', 'uploads'), (err) =>
          err ? (error = true) : console.log('good')
        );
        if (!error) {
          return res.status(200).json({
            code: '200',
            message: '해당 트윗의 삭제가 완료되었습니다!',
          });
        } else {
          return res
            .status(500)
            .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
        }
      } else {
        return res.status(404).json({
          code: 'Not Found',
          message: `게시글 정보가 없습니다.`,
          payload: tweet,
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/pray/:id',
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const pray = await Pray.findOne({ where: { id: req.params.id } });
      if (pray) {
        await Pray.destroy({ where: { id: req.params.id } });
        return res.status(200).json({
          code: 'OK',
          message: '해당 기도제목의 삭제가 완료되었습니다!',
        });
      } else {
        return res.status(404).json({
          code: 'Not Found',
          message: '삭제되었거나 없는 기도제목입니다.',
        });
      }
    } catch (e) {
      next(e);
    }
  }
);

export default router;
