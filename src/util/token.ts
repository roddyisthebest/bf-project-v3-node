import jwt from 'jsonwebtoken';

const token = {
  generateAccessToken: function (id: number) {
    return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: '1 days',
    });
  },
  generateRefreshToken: function (id: number) {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET as string, {
      expiresIn: '180 days',
    });
  },
};

export default token;
