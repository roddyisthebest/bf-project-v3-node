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
import authToken from './middleware/authToken';
import authUser from './middleware/authUser';
const HTTP_PORT = 3000;
const HTTPS_PORT = 443;

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src/img', express.static(path.join(__dirname, 'uploads')));
sequelize
  .sync({ force: false })
  .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
  .catch((err) => {
    console.log(err);
  });

app.get('/', (req: any, res: Response, next: NextFunction) => {
  return res.status(200).json({ message: 'test' });
});

app.use('/user', userRoutes);
app.use('/pray', authToken, authUser, prayRoutes);
app.use('/penalty', authToken, authUser, penaltyRoutes);
app.use('/tweet', authToken, authUser, tweetRoutes);
app.use('/token', tokenRoutes);
app.use('/team', teamRoutes);

if (process.env.NODE_ENV === 'production') {
  //
} else {
  app.listen(HTTP_PORT, () => {
    console.log(`running on port ${HTTP_PORT}`);
  });
}
