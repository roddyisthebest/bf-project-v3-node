import dotenv from 'dotenv';
import express, { NextFunction, Response } from 'express';
import { sequelize } from './model';
import cors from 'cors';
import path from 'path';
import userRoutes from './routes/user';
import prayRoutes from './routes/pray';
import penaltyRoutes from './routes/penalty';
import tweetRoutes from './routes/tweet';
import tokenRoutes from './routes/token';
import teamRoutes from './routes/team';
import searchRoutes from './routes/search';
import authToken from './middleware/authToken';
import { settingPenalty, givingWarning } from './util/func';
import admin from 'firebase-admin';
const HTTP_PORT = 4000;
const HTTPS_PORT = 443;

const app = express();

dotenv.config();

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  'src/bf-project-v3-firebase-adminsdk-vikyp-ed16b4f5cf.json';

admin.initializeApp({
  credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  databaseURL: 'https://bf-project-v3.firebaseio.com',
});

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src/img', express.static(path.join(__dirname, 'uploads')));
sequelize
  .sync({ force: false })
  .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
  .catch((err) => {
    console.log(err);
  });

settingPenalty();
givingWarning();
app.use('/user', userRoutes);
app.use('/pray', authToken, prayRoutes);
app.use('/penalty', authToken, penaltyRoutes);
app.use('/tweet', authToken, tweetRoutes);
app.use('/token', tokenRoutes);
app.use('/team', authToken, teamRoutes);
app.use('/search', authToken, searchRoutes);

app.get('/', (req: any, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'test' });
});

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  console.log('라우터가 없습니다.');
  next(error);
});

app.use((err: Error, req: any, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'prod' ? err : {};
  res.status(500);
  console.log('error');
  console.log(err.message, 'File too large');
  console.log(err.message === 'File too large');
  if (err.message === 'File too large') {
    return res.status(413).json({ code: 413, message: err.message });
  }
  res.json({ code: 500, message: err.message });
});

if (process.env.NODE_ENV === 'production') {
  //
} else {
  app.listen(HTTP_PORT, () => {
    console.log(`running on port ${HTTP_PORT}`);
  });
}
