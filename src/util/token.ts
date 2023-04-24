import jwt, { verify } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
const privateKey = {
  key: fs.readFileSync(path.join(__dirname, '../../private.pem'), 'utf8'),
  passphrase: 'bsy30228', // 비밀키 발급 시 입력했던 패스워드
};

export const publicKey = fs.readFileSync(
  path.join(__dirname, '../../public.pem'),
  'utf-8'
);

const token = {
  generateAccessToken: function (id: number, name: string) {
    const accessToken = jwt.sign({ id, name }, privateKey, {
      expiresIn: '10 days',
      algorithm: 'RS256',
    });
    return accessToken;
  },
  generateRefreshToken: function (id: number, name: string) {
    return jwt.sign({ id, name }, privateKey, {
      expiresIn: '100 days',
      algorithm: 'RS256',
    });
  },
};

export default token;
