import { Sequelize } from 'sequelize';
import { penaltyInit, Penalty } from './penalty';
import { Pray, prayInit } from './pray';
import { Service, serviceInit } from './service';
import { User, userInit } from './user';
import { Tweet, tweetInit } from './tweet';
import { Team, teamInit } from './team';
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config').default[env];

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

userInit(sequelize);
penaltyInit(sequelize);
prayInit(sequelize);
tweetInit(sequelize);
serviceInit(sequelize);
teamInit(sequelize);

User.associate();
Pray.associate();
Service.associate();
Tweet.associate();
Penalty.associate();
Team.associate();
