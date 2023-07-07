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
const express_1 = __importDefault(require("express"));
const user_1 = require("../model/user");
const sequelize_1 = require("sequelize");
const pray_1 = require("../model/pray");
const service_1 = require("../model/service");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const team_1 = require("../model/team");
const invitation_1 = require("../model/invitation");
const tweet_1 = require("../model/tweet");
const penalty_1 = require("../model/penalty");
const authTeam_1 = __importDefault(require("../middleware/authTeam"));
const authBoss_1 = __importDefault(require("../middleware/authBoss"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const date_1 = __importDefault(require("../util/date"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination(req, file, cb) {
            cb(null, `uploads`);
        },
        filename(req, file, cb) {
            console.log(file);
            const ext = path_1.default.extname(file.originalname);
            cb(null, path_1.default.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});
router.get('/:teamId', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const team = yield team_1.Team.findOne({ where: { id: req.team.id } });
        return res.status(200).json({
            code: 'OK',
            message: '팀 정보입니다.',
            payload: team,
        });
    }
    catch (e) {
        next(e);
    }
}));
router.get('/:teamId/service', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const service = yield service_1.Service.findOne({
            where: { TeamId: req.team.id, UserId: req.id },
        });
        if (service) {
            return res.status(200).json({
                code: 'OK',
                message: '서비스 이용 정보 입니다.',
                payload: service,
            });
        }
        return res.status(404).json({
            code: 'Not Found',
            message: '서비스 이용 정보가 없습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.put('/:teamId/service', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, tweet, penalty, pray } = req.body;
        const service = yield service_1.Service.findOne({ where: { id } });
        if (service) {
            yield service_1.Service.update({ tweet, penalty, pray }, { where: { id } });
            if (penalty) {
                const penaltyRc = yield penalty_1.Penalty.findOne({
                    where: {
                        TeamId: req.team.id,
                        UserId: req.id,
                        weekend: date_1.default.thisWeekendToString(),
                    },
                });
                if (!penaltyRc) {
                    yield penalty_1.Penalty.create({
                        weekend: date_1.default.thisWeekendToString(),
                        UserId: req.id,
                        TeamId: req.team.id,
                    });
                }
            }
            return res.status(200).json({
                code: 'OK',
                message: '서비스 이용 정보가 수정되었습니다.',
            });
        }
        return res.status(404).json({
            code: 'Not Found',
            message: '서비스 이용 정보가 없습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.post('', upload.single('img'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, introducing } = req.body;
        console.log(name, introducing);
        const img = ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || '';
        console.log(name, introducing, img);
        if (!img) {
            return res
                .status(400)
                .json({ message: '잘못된 형식의 data입니다.', code: 'Bad Request' });
        }
        const user = yield user_1.User.findOne({ where: { id: req.id } });
        const teams = yield user.getTeams({ where: { bossId: req.id } });
        let error = false;
        if (teams.length === 3) {
            fs_1.default.rm(img, (err) => (err ? (error = true) : (error = false)));
            if (error) {
                return res
                    .status(500)
                    .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
            }
            else {
                return res.status(403).json({
                    code: 'Forbidden:ExceededTeam',
                    message: '팀 최대 생성 횟수를 초과했습니다.',
                });
            }
        }
        const team = yield team_1.Team.create({
            UserId: req.id,
            bossId: req.id,
            name,
            img: img && img.replace('uploads', 'src/img'),
            introducing,
        });
        yield user.addTeam(parseInt(team.id, 10));
        console.log(img, 'img');
        return res.status(201).json({
            code: 'Created',
            message: `성공적으로 팀 ${name}이 생성되었습니다.`,
            payload: {
                bossId: req.id,
                name,
                img: img && img.replace('uploads', 'src/img'),
                introducing,
            },
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.post('/invitation', authTeam_1.default, authBoss_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        const team = yield team_1.Team.findOne({ where: { id: req.team.id } });
        const join = yield team.getUsers({
            where: { id: userId },
        });
        console.log(join);
        if (join.length !== 0) {
            return res.status(409).json({
                code: 'Conflict',
                message: '이미 가입된 회원입니다.',
            });
        }
        const alreadyInvitation = yield invitation_1.Invitation.findOne({
            where: {
                UserId: userId,
                TeamId: req.team.id,
            },
        });
        if (alreadyInvitation) {
            return res.status(409).json({
                code: 'Conflict',
                message: '이미 초대한 회원입니다.',
            });
        }
        yield invitation_1.Invitation.create({
            UserId: userId,
            TeamId: req.team.id,
        });
        const user = yield user_1.User.findOne({
            where: { id: userId },
        });
        yield firebase_admin_1.default.messaging().send({
            token: user.phoneToken,
            data: {
                code: 'invitation:post',
            },
            notification: {
                title: '회원 초대 💌',
                body: `${user.name}님! 팀 ${team.name}이 팀 초대장을 보냈어요.`,
            },
            android: {
                notification: {
                    channelId: 'join',
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
                        threadId: 'join',
                    },
                },
            },
        });
        return res.status(201).send({
            code: 'Created',
            message: '초대가 성공적으로 완료되었습니다.',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.post('/invitation/approve', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: stringId } = req.body;
        const id = parseInt(stringId, 10);
        const invitations = yield invitation_1.Invitation.findAll({
            where: { UserId: req.id, active: true },
        });
        if (invitations.length === 0 ||
            !invitations.some((invitation) => invitation.id === id)) {
            return res.status(403).json({
                code: 'Forbidden',
                message: '잘못된 접근입니다.',
            });
        }
        const invitation = yield invitation_1.Invitation.findOne({ where: { id } });
        const team = yield team_1.Team.findOne({
            where: { id: invitation.TeamId },
        });
        yield team.addUser(req.id);
        yield invitation_1.Invitation.destroy({ where: { id } });
        const boss = yield user_1.User.findOne({
            where: { id: team.bossId },
        });
        yield firebase_admin_1.default.messaging().send({
            token: boss.phoneToken,
            data: {
                code: 'invitation:approve',
            },
            notification: {
                title: '초대 수락🥰',
                body: `${boss.name}님! ${req.name}님이 팀 ${team.name}의 초대를 수락하였습니다.`,
            },
            android: {
                notification: {
                    channelId: 'join',
                    vibrateTimingsMillis: [0, 500, 500, 500],
                    priority: 'default',
                    defaultVibrateTimings: false,
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        category: 'default',
                        threadId: 'join',
                    },
                },
            },
        });
        return res.status(201).json({
            code: 'Created',
            message: '팀의 초대 제안에 수락하였습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.post('/application', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId: stringId } = req.body;
    const teamId = parseInt(stringId, 10);
    try {
        const team = yield team_1.Team.findOne({ where: { id: teamId } });
        const join = yield team.getUsers({
            where: { id: req.id },
        });
        if (join.length !== 0) {
            return res.status(409).json({
                code: 'Conflict',
                message: '이미 가입된 회원입니다.',
            });
        }
        const alreadyApplication = yield invitation_1.Invitation.findOne({
            where: {
                UserId: req.id,
                TeamId: teamId,
                active: false,
            },
        });
        if (alreadyApplication) {
            return res.status(409).json({
                code: 'Conflict',
                message: '이미 신청한 팀입니다.',
            });
        }
        yield invitation_1.Invitation.create({
            UserId: req.id,
            TeamId: teamId,
            active: false,
        });
        const boss = yield user_1.User.findOne({ where: { id: team.bossId } });
        yield firebase_admin_1.default.messaging().send({
            token: boss.phoneToken,
            notification: {
                title: '가입신청📮',
                body: `${req.name}님이 팀 ${team.name}에 가입신청하였습니다.`,
            },
            android: {
                notification: {
                    channelId: 'join',
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
                        threadId: 'join',
                    },
                },
            },
        });
        return res.status(201).send({
            code: 'Created',
            message: '가입신청이 성공적으로 완료되었습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.post('/application/approve', authTeam_1.default, authBoss_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id: stringId } = req.body;
        const id = parseInt(stringId, 10);
        const application = yield invitation_1.Invitation.findOne({ where: { id } });
        if (application) {
            const team = yield team_1.Team.findOne({
                where: { id: application.TeamId },
            });
            yield team.addUser(application.UserId);
            yield invitation_1.Invitation.destroy({ where: { id } });
            const user = yield user_1.User.findOne({
                where: { id: application.UserId },
            });
            yield firebase_admin_1.default.messaging().send({
                token: user.phoneToken,
                data: {
                    code: 'application:approve',
                },
                notification: {
                    title: '가입신청 수락',
                    body: `${user.name}님! 팀 ${team.name}에 가입되었습니다.`,
                },
                android: {
                    notification: {
                        channelId: 'join',
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
                            threadId: 'join',
                        },
                    },
                },
            });
            return res.status(201).json({
                code: 'Created',
                message: `가입 신청을 수락하셨습니다.`,
            });
        }
        return res.status(404).json({
            code: 'Not Found',
            message: '유저가 가입신청을 이미 취소하였습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.get('/:teamId/application/:lastId', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { lastId: stringLastId } = req.params;
    const lastId = parseInt(stringLastId, 10);
    let where = { TeamId: req.team.id, active: false };
    if (lastId !== -1) {
        where.id = { [sequelize_1.Op.lt]: lastId };
    }
    try {
        const applications = yield invitation_1.Invitation.findAll({
            where,
            limit: 15,
            order: [['createdAt', 'DESC']],
            include: [{ model: user_1.User, attributes: ['id', 'name', 'img', 'oauth'] }],
        });
        if (applications.length === 15) {
            return res.json({
                code: 'OK',
                payload: applications,
                message: '팀에 가입 신청한 유저들의 목록입니다.',
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: applications,
                message: `팀에 가입 신청한 유저들의 마지막 목록입니다.`,
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.get('/:teamId/invitation/:lastId', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { lastId: stringLastId } = req.params;
    const lastId = parseInt(stringLastId, 10);
    try {
        const invitations = yield invitation_1.Invitation.findAll({
            where: lastId !== -1
                ? { TeamId: req.team.id, id: { [sequelize_1.Op.lt]: lastId }, active: true }
                : { TeamId: req.team.id, active: true },
            limit: 15,
            order: [['createdAt', 'DESC']],
            include: [{ model: user_1.User, attributes: ['id', 'name', 'img', 'oauth'] }],
        });
        if (invitations.length === 15) {
            return res.json({
                code: 'OK',
                payload: invitations,
                message: '팀의 초대유저 목록입니다.',
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: invitations,
                message: `팀의 초대유저 마지막 목록입니다.`,
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.get('/:teamId/mates/:lastId', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { lastId: stringLastId } = req.params;
    const lastId = parseInt(stringLastId, 10);
    try {
        const team = yield team_1.Team.findOne({ where: { id: req.team.id } });
        const payload = yield team.getUsers({
            limit: 15,
            where: lastId === -1 ? {} : { id: { [sequelize_1.Op.lt]: lastId } },
        });
        if ((payload === null || payload === void 0 ? void 0 : payload.length) === 15) {
            return res.json({
                code: 'OK',
                payload,
                message: '팀원 목록입니다.',
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload,
                message: `팀원 마지막 목록입니다.`,
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.put('/:teamId', authTeam_1.default, authBoss_1.default, upload.single('img'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    console.log('편집으로 왔뎌');
    const { name, introducing } = req.body;
    const img = ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) || '';
    try {
        let error = false;
        if (img.length !== 0) {
            fs_1.default.rm(req.team.img.replace('src/img', 'uploads'), (err) => err ? (error = true) : console.log('삭제완료'));
            if (error) {
                return res
                    .status(500)
                    .json({ message: '서버에러입니다.', code: 'Delete Error' });
            }
            yield team_1.Team.update({ introducing, name, img: img.replace('uploads', 'src/img') }, { where: { id: req.team.id } });
            return res.status(200).send({
                code: 'OK',
                message: '팀의 정보가 성공적으로 변경되었습니다.',
            });
        }
        else {
            yield team_1.Team.update({ introducing, name }, { where: { id: req.team.id } });
            return res.status(200).send({
                code: 'OK',
                message: '팀의 정보가 성공적으로 변경되었습니다.',
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.delete('/:teamId', authTeam_1.default, authBoss_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tweets = yield tweet_1.Tweet.findAll({
            where: { TeamId: req.team.id },
        });
        let error = false;
        tweets.map((tweet) => {
            fs_1.default.rm(tweet.img.replace('src/img', 'uploads'), (err) => err ? (error = true) : console.log('삭제완료'));
        });
        let teamImageError = false;
        fs_1.default.rm(req.team.img.replace('src/img', 'uploads'), (err) => err ? (teamImageError = true) : (teamImageError = false));
        if (error || teamImageError) {
            return res
                .status(500)
                .json({ message: '서버에러입니다.', code: 'Delete Error' });
        }
        yield team_1.Team.destroy({ where: { id: req.team.id } });
        yield service_1.Service.destroy({ where: { TeamId: req.team.id } });
        yield invitation_1.Invitation.destroy({ where: { TeamId: req.team.id } });
        yield tweet_1.Tweet.destroy({ where: { TeamId: req.team.id } });
        yield penalty_1.Penalty.destroy({ where: { TeamId: req.team.id } });
        yield pray_1.Pray.destroy({ where: { TeamId: req.team.id } });
        return res.status(200).json({
            code: 'OK',
            message: '동아리가 성공적으로 삭제 되었습니다.',
        });
    }
    catch (e) {
        console.error(e);
        next(e);
    }
}));
router.delete('/:teamId/invitation/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const invitation = yield invitation_1.Invitation.findOne({ where: { id } });
        if (invitation) {
            const team = yield team_1.Team.findOne({
                where: { id: invitation.TeamId },
            });
            const boss = yield user_1.User.findOne({
                where: { id: team.bossId },
            });
            if (boss.id !== req.id) {
                yield firebase_admin_1.default.messaging().send({
                    token: boss.phoneToken,
                    data: {
                        code: 'invitation:delete',
                    },
                    notification: {
                        title: '초대 거절😢',
                        body: `${boss.name}님! ${req.name}님이 팀 ${team.name}의 초대를 거절하였습니다.`,
                    },
                    android: {
                        notification: {
                            channelId: 'join',
                            vibrateTimingsMillis: [0, 500, 500, 500],
                            priority: 'default',
                            defaultVibrateTimings: false,
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                category: 'default',
                                threadId: 'join',
                            },
                        },
                    },
                });
            }
            yield invitation_1.Invitation.destroy({ where: { id } });
            return res.status(200).json({
                code: 'OK',
                message: '초대가 성공적으로 취소되었습니다',
            });
        }
        return res.status(403).json({
            code: 'Forbidden',
            message: '취소처리된 초대장입니다.',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.delete('/:teamId/application/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const invitation = yield invitation_1.Invitation.findOne({ where: { id } });
        if (invitation) {
            const team = yield team_1.Team.findOne({
                where: { id: invitation.TeamId },
            });
            const boss = yield user_1.User.findOne({
                where: { id: team.bossId },
            });
            const user = yield user_1.User.findOne({
                where: { id: invitation.UserId },
            });
            yield invitation_1.Invitation.destroy({ where: { id } });
            if (req.id === boss.id) {
                yield firebase_admin_1.default.messaging().send({
                    token: user.phoneToken,
                    data: {
                        code: 'application:delete',
                    },
                    notification: {
                        title: '가입 신청 거부',
                        body: `${user.name}님! 팀 ${team.name} 가입신청이 거부당하였습니다. `,
                    },
                    android: {
                        notification: {
                            channelId: 'join',
                            vibrateTimingsMillis: [0, 500, 500, 500],
                            priority: 'default',
                            defaultVibrateTimings: false,
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                category: 'default',
                                threadId: 'join',
                            },
                        },
                    },
                });
            }
            return res.status(200).json({
                code: 'OK',
                message: '가입 신청이 성공적으로 취소되었습니다',
            });
        }
        return res.status(403).json({
            code: 'Forbidden',
            message: '이미 취소처리된 가입신청입니다.',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.delete('/:teamId/dropout/:userId', authTeam_1.default, authBoss_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId: stringId } = req.params;
        const userId = parseInt(stringId, 10);
        const team = yield team_1.Team.findOne({ where: { id: req.team.id } });
        const join = yield team.getUsers({ where: { id: userId } });
        if (join.length === 0) {
            return res.status(409).json({
                code: 'Conflict',
                message: '가입되지 않은 회원입니다.',
            });
        }
        const tweets = yield tweet_1.Tweet.findAll({
            where: { UserId: userId, TeamId: req.team.id },
        });
        let error = false;
        tweets.map((tweet) => {
            fs_1.default.rm(tweet.img.replace('src/img', 'uploads'), (err) => err ? (error = true) : console.log('삭제완료'));
        });
        if (error) {
            return res
                .status(500)
                .json({ message: '서버에러입니다.', code: 'Delete Error' });
        }
        yield team.removeUser(userId);
        yield tweet_1.Tweet.destroy({
            where: {
                UserId: userId,
                TeamId: req.team.id,
            },
        });
        yield penalty_1.Penalty.destroy({
            where: {
                UserId: userId,
                TeamId: req.team.id,
            },
        });
        yield pray_1.Pray.destroy({
            where: {
                UserId: userId,
                TeamId: req.team.id,
            },
        });
        yield service_1.Service.destroy({
            where: {
                UserId: userId,
                TeamId: req.team.id,
            },
        });
        const user = yield user_1.User.findOne({ where: { id: userId } });
        yield firebase_admin_1.default.messaging().send({
            token: user.phoneToken,
            data: {
                code: 'team:dropout',
                teamId: req.team.id.toString(),
            },
            notification: {
                title: '팀 강퇴',
                body: `${user.name}님! 팀 ${team.name}에서 강퇴되었습니다.`,
            },
            android: {
                notification: {
                    channelId: 'join',
                    vibrateTimingsMillis: [0, 500, 500, 500],
                    priority: 'default',
                    defaultVibrateTimings: false,
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        category: 'default',
                        threadId: 'join',
                    },
                },
            },
        });
        return res.status(200).send({
            code: 'OK',
            message: '유저가 성공적으로 강퇴되었습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.delete('/:teamId/withdraw', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tweets = yield tweet_1.Tweet.findAll({
            where: { UserId: req.id, TeamId: req.team.id },
        });
        let error = false;
        tweets.map((tweet) => {
            fs_1.default.rm(tweet.img.replace('src/img', 'uploads'), (err) => err ? (error = true) : console.log('삭제완료'));
        });
        if (error) {
            return res
                .status(500)
                .json({ message: '서버에러입니다.', code: 'Delete Error' });
        }
        const user = yield user_1.User.findOne({ where: { id: req.id } });
        yield user.removeTeam(req.team.id);
        yield tweet_1.Tweet.destroy({
            where: {
                UserId: req.id,
                TeamId: req.team.id,
            },
        });
        yield penalty_1.Penalty.destroy({
            where: {
                UserId: req.id,
                TeamId: req.team.id,
            },
        });
        yield pray_1.Pray.destroy({
            where: {
                UserId: req.id,
                TeamId: req.team.id,
            },
        });
        yield service_1.Service.destroy({
            where: {
                UserId: req.id,
                TeamId: req.team.id,
            },
        });
        const boss = yield user_1.User.findOne({ where: { id: req.team.bossId } });
        yield firebase_admin_1.default.messaging().send({
            token: boss.phoneToken,
            data: {
                code: 'team:withdraw',
            },
            notification: {
                title: '팀 탈퇴',
                body: `팀 ${req.team.name}의 ${req.name}님이 탈퇴하였습니다.`,
            },
            android: {
                notification: {
                    channelId: 'join',
                    vibrateTimingsMillis: [0, 500, 500, 500],
                    priority: 'default',
                    defaultVibrateTimings: false,
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        category: 'default',
                        threadId: 'join',
                    },
                },
            },
        });
        return res.status(200).send({
            code: 'OK',
            message: `${req.name}님 탈퇴가 성공적으로 이루어졌습니다.`,
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
exports.default = router;
