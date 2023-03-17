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

router.put('', async (req: any, res: Response, next: NextFunction) => {
  const { name, introducing, id } = req.body;

  try {
    const team: any = await Team.findOne({
      where: { id },
    });
    if (req.id !== team.bossId) {
      return res.status(403).json({
        code: 'Forbidden',
        msg: '권한이 없습니다.',
      });
    }

    await Team.update({ name, introducing }, { where: { id } });
    return res.status(200).send({
      code: 'OK',
      msg: '팀의 정보가 성공적으로 변경되었습니다.',
    });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const team: any = await Team.findOne({
      where: { id },
    });
    if (req.id !== team.bossId) {
      return res.status(403).json({
        code: 'Forbidden',
        msg: '권한이 없습니다.',
      });
    }

    await Team.destroy({ where: { id } });
    return res.status(200).json({
      code: 'OK',
      msg: '동아리가 성공적으로 삭제 되었습니다.',
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
});

export default router;
