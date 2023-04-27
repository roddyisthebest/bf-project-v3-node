import schedule from 'node-schedule';
import { Team } from '../model/team';
import { Service } from '../model/service';
import { Op } from 'sequelize';
import admin from 'firebase-admin';
import { Tweet } from '../model/tweet';
import date from './date';
import moment from 'moment';
import { Penalty } from '../model/penalty';
import fs from 'fs';
const givingWarning = () =>
  schedule.scheduleJob('0 30 23 * * *', async function () {
    try {
      if (date.isItSunday()) {
        return;
      }
      const teams = await Team.findAll();

      teams.map(async (team) => {
        const users = await team.getUsers();

        users.map(async (user: any) => {
          const service: any = await Service.findOne({
            where: { UserId: user.id },
          });
          if (!service.tweet) {
            return;
          }

          const alreadyTweet = await Tweet.findOne({
            where: {
              UserId: user.id,
              TeamId: team.id,
              createdAt: {
                [Op.between]: [date.startOfToday(), date.endOfToday()],
              },
            },
          });
          if (user.phoneToken.length !== 0 && !alreadyTweet) {
            await admin.messaging().send({
              data: {
                code: 'tweet:warning',
                team: JSON.stringify(team),
              },
              token: user.phoneToken,
              notification: {
                title: '매일성경 알림 ⚠️',
                body: `팀 ${team.name}의 ${user?.name}님 매일성경 게시글을 올려주세요. 30분 남았답니다.`,
              },
              android: {
                notification: {
                  channelId: 'penalty',
                  vibrateTimingsMillis: [0, 500, 500, 500],
                  priority: 'high',
                  defaultVibrateTimings: false,
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    category: 'default',
                  },
                },
              },
            });
          }
        });
      });
    } catch (e) {
      console.log(e);
    }
  });

const settingPenalty = () =>
  schedule.scheduleJob('0 0 0 * * SUN', async function () {
    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      const lastWeekend = moment(yesterday).day(0).format('YYYY-MM-DD');
      const teams = await Team.findAll();

      console.log(teams.length, 'teams.length');
      teams.map(async (team) => {
        const users = await team.getUsers();

        console.log(users.length, users, 'users.length');

        users.map(async (user: any) => {
          const service: any = await Service.findOne({
            where: { UserId: user.id },
          });

          if (!service.penalty) {
            return;
          }

          const tweetsOfTheWeek = await Tweet.findAll({
            where: { weekend: lastWeekend, UserId: user.id, TeamId: team.id },
          });

          let pay = 1000 * (6 - tweetsOfTheWeek.length);

          if (!(date.isThisMonthOdd() && date.weekOfMonth(yesterday))) {
            tweetsOfTheWeek.map((tweet: any) => {
              if (tweet?.img.length === 0) {
                pay += 500;
              }
            });
          }
          const penalty: any = await Penalty.findOne({
            where: { UserId: user.id, TeamId: team.id, weekend: lastWeekend },
          });

          console.log(penalty, 'penalty');

          if (!penalty?.payed) {
            pay += penalty?.paper;
          }

          await Penalty.create({
            paper: pay,
            weekend: date.thisWeekendToString(),
            UserId: user.id,
            TeamId: team.id,
            payed: pay === 0,
          });

          if (
            date.weekOfMonth(date.thisWeekendToString()) === 2 ||
            date.weekOfMonth(date.thisWeekendToString()) === 4
          ) {
            const tweets = await Tweet.findAll();
            tweets.map((tweet: any) => {
              if (tweet.img.length === 0) {
                return;
              }
              fs.rm(tweet.img.replace('img', 'uploads'), (err) =>
                err
                  ? console.log('사진 삭제 에러입니다.')
                  : console.log('사진이 성공적으로 삭제')
              );
            });
            await Tweet.destroy({ where: {}, truncate: true });
          }

          if (user.phoneToken.length !== 0) {
            await admin.messaging().send({
              data: {
                code: 'penalty:set',
                team: JSON.stringify(team),
              },
              token: user.phoneToken,
              notification: {
                title: '벌금 책정',
                body: `팀${team.name}의 벌금이 책정되었습니다. 확인해보세요!`,
              },
              android: {
                notification: {
                  channelId: 'penalty',
                  vibrateTimingsMillis: [0, 500, 500, 500],
                  priority: 'high',
                  defaultVibrateTimings: false,
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    category: 'default',
                  },
                },
              },
            });
          }
        });
      });
    } catch (e) {
      console.log(e);
    }
  });

export { givingWarning, settingPenalty };
