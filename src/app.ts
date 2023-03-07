import dotenv from 'dotenv';
import { sequelize } from './model';

dotenv.config();
sequelize
  .sync({ force: false })
  .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
  .catch((err) => {
    console.log(err);
  });
console.log('Hello World!');
