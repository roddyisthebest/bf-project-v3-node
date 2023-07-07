"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingPenalty = exports.givingWarning = void 0;
const node_schedule_1 = __importDefault(require("node-schedule"));
const team_1 = require("../model/team");
const service_1 = require("../model/service");
const sequelize_1 = require("sequelize");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const tweet_1 = require("../model/tweet");
const date_1 = __importDefault(require("./date"));
const moment_1 = __importDefault(require("moment"));
const penalty_1 = require("../model/penalty");
const fs_1 = __importDefault(require("fs"));
const givingWarning = () => node_schedule_1.default.scheduleJob('0 30 23 * * *', function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (date_1.default.isItSunday()) {
                return;
            }
            const teams = yield team_1.Team.findAll();
            teams.map((team) => __awaiter(this, void 0, void 0, function* () {
                const users = yield team.getUsers();
                users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const service = yield service_1.Service.findOne({
                        where: { UserId: user.id },
                    });
                    if (!service.tweet) {
                        return;
                    }
                    const alreadyTweet = yield tweet_1.Tweet.findOne({
                        where: {
                            UserId: user.id,
                            TeamId: team.id,
                            createdAt: {
                                [sequelize_1.Op.between]: [date_1.default.startOfToday(), date_1.default.endOfToday()],
                            },
                        },
                    });
                    if (user.phoneToken.length !== 0 && !alreadyTweet) {
                        yield firebase_admin_1.default.messaging().send({
                            data: {
                                code: 'tweet:warning',
                                team: JSON.stringify(team),
                            },
                            token: user.phoneToken,
                            notification: {
                                title: '매일성경 알림 ⚠️',
                                body: `팀 ${team.name}의 ${user === null || user === void 0 ? void 0 : user.name}님 매일성경 게시글을 올려주세요. 30분 남았답니다.`,
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
                }));
            }));
        }
        catch (e) {
            console.log(e);
        }
    });
});
exports.givingWarning = givingWarning;
const settingPenalty = () => node_schedule_1.default.scheduleJob('0 0 0 * * SUN', function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const yesterday = (0, moment_1.default)().subtract(1, 'day').format('YYYY-MM-DD');
            const lastWeekend = (0, moment_1.default)(yesterday).day(0).format('YYYY-MM-DD');
            const teams = yield team_1.Team.findAll();
            console.log(teams.length, 'teams.length');
            teams.map((team) => __awaiter(this, void 0, void 0, function* () {
                const users = yield team.getUsers();
                console.log(users.length, users, 'users.length');
                users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const service = yield service_1.Service.findOne({
                        where: { UserId: user.id },
                    });
                    if (!service.penalty) {
                        return;
                    }
                    const tweetsOfTheWeek = yield tweet_1.Tweet.findAll({
                        where: { weekend: lastWeekend, UserId: user.id, TeamId: team.id },
                    });
                    let pay = 1000 * (6 - tweetsOfTheWeek.length);
                    if (!(date_1.default.isThisMonthOdd() && date_1.default.weekOfMonth(yesterday))) {
                        tweetsOfTheWeek.map((tweet) => {
                            if ((tweet === null || tweet === void 0 ? void 0 : tweet.img.length) === 0) {
                                pay += 500;
                            }
                        });
                    }
                    const penalty = yield penalty_1.Penalty.findOne({
                        where: { UserId: user.id, TeamId: team.id, weekend: lastWeekend },
                    });
                    console.log(penalty, 'penalty');
                    if (!(penalty === null || penalty === void 0 ? void 0 : penalty.payed)) {
                        pay += penalty === null || penalty === void 0 ? void 0 : penalty.paper;
                    }
                    yield penalty_1.Penalty.create({
                        paper: pay,
                        weekend: date_1.default.thisWeekendToString(),
                        UserId: user.id,
                        TeamId: team.id,
                        payed: pay === 0,
                    });
                    if (user.phoneToken.length !== 0) {
                        yield firebase_admin_1.default.messaging().send({
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
                }));
                if (date_1.default.weekOfMonth(date_1.default.thisWeekendToString()) === 2 ||
                    date_1.default.weekOfMonth(date_1.default.thisWeekendToString()) === 4) {
                    const tweets = yield tweet_1.Tweet.findAll();
                    tweets.map((tweet) => {
                        if (tweet.img.length === 0) {
                            return;
                        }
                        fs_1.default.rm(tweet.img.replace('img', 'src/uploads'), (err) => err
                            ? console.log('사진 삭제 에러입니다.')
                            : console.log('사진이 성공적으로 삭제'));
                    });
                    yield tweet_1.Tweet.destroy({ where: {}, truncate: true });
                }
            }));
        }
        catch (e) {
            console.log(e);
        }
    });
});
exports.settingPenalty = settingPenalty;
