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
const sequelize_1 = require("sequelize");
const user_1 = require("../model/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const md5_1 = __importDefault(require("md5"));
const token_1 = __importDefault(require("../util/token"));
const authToken_1 = __importDefault(require("../middleware/authToken"));
const service_1 = require("../model/service");
const penalty_1 = require("../model/penalty");
const date_1 = __importDefault(require("../util/date"));
const tweet_1 = require("../model/tweet");
const pray_1 = require("../model/pray");
const team_1 = require("../model/team");
const invitation_1 = require("../model/invitation");
const authTeam_1 = __importDefault(require("../middleware/authTeam"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
router.post('/signup', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { uid, password, name } = req.body;
    try {
        const exUser = yield user_1.User.findOne({
            where: {
                [sequelize_1.Op.or]: [{ uid }, { name }],
            },
        });
        if (exUser) {
            return res.status(409).json({
                code: 'Conflict',
                message: '이미 회원가입 되었거나 이름이 중복된 유저가 존재합니다.',
            });
        }
        const hash = yield bcrypt_1.default.hash(password, 12);
        const user = yield user_1.User.create({
            uid,
            password: hash,
            name,
            img: `https://s.gravatar.com/avatar/${(0, md5_1.default)(uid)}?s=32&d=retro`,
            oauth: 'local',
        });
        let accessToken = token_1.default.generateAccessToken(user.id, user.name);
        let refreshToken = token_1.default.generateRefreshToken(user.id, user.name);
        return res.status(201).json({
            message: `${user.name}님 성공적으로 회원등록 되었습니다.`,
            payload: {
                token: {
                    accessToken,
                    refreshToken,
                },
                userInfo: Object.assign({}, user.dataValues),
            },
            code: 'Created',
        });
    }
    catch (e) {
        return next(e);
    }
}));
router.post('/signin', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { uid, password } = req.body;
    try {
        const exUser = yield user_1.User.findOne({
            where: { uid },
        });
        if (exUser) {
            const result = yield bcrypt_1.default.compare(password, exUser.password);
            if (result) {
                exUser.dataValues.password = null;
                let accessToken = token_1.default.generateAccessToken(exUser.id, exUser.name);
                let refreshToken = token_1.default.generateRefreshToken(exUser.id, exUser.name);
                return res.status(200).json({
                    message: `${exUser.name}님 안녕하세요!`,
                    payload: {
                        token: {
                            accessToken,
                            refreshToken,
                        },
                        userInfo: Object.assign({}, exUser.dataValues),
                    },
                    code: 'OK',
                });
            }
            else {
                return res.status(400).json({
                    code: 'Bad Request',
                    message: '올바르지 않은 비밀번호입니다.',
                });
            }
        }
        else {
            return res.status(400).json({
                code: 'Bad Request',
                message: '가입되지 않은 회원입니다.',
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.post('/login/sns', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { uid, name, img, oauth } = req.body;
    try {
        const exUser = yield user_1.User.findOne({
            where: { uid, oauth },
        });
        if (exUser) {
            console.log(exUser.id);
            const accessToken = token_1.default.generateAccessToken(exUser.id, exUser.name);
            const refreshToken = token_1.default.generateRefreshToken(exUser.id, exUser.name);
            return res.status(200).json({
                message: `${exUser.name}님 안녕하세요!`,
                payload: {
                    token: {
                        accessToken,
                        refreshToken,
                    },
                    userInfo: Object.assign({}, exUser.dataValues),
                },
                code: 'OK',
            });
        }
        const newUser = yield user_1.User.create({
            uid,
            name,
            img: img
                ? img
                : `https://s.gravatar.com/avatar/${(0, md5_1.default)(uid)}?s=32&d=retro`,
            oauth,
        });
        const accessToken = token_1.default.generateAccessToken(newUser.id, newUser.name);
        const refreshToken = token_1.default.generateRefreshToken(newUser.id, newUser.name);
        return res.status(201).json({
            message: `${newUser.name}님 ${oauth}를 통한 가입을 축하합니다.`,
            payload: {
                token: {
                    accessToken,
                    refreshToken,
                },
                userInfo: Object.assign({}, newUser.dataValues),
            },
            code: 'Created',
        });
    }
    catch (e) {
        console.log(e);
    }
}));
router.patch('', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, img } = req.body;
    try {
        yield user_1.User.update({ name, img }, { where: { id: req.id } });
        res.status(200).json({
            message: '성공적으로 회원님의 정보가 바뀌었습니다.',
            code: 'OK',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.get('/service/team/:teamId', authToken_1.default, authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const alreadyService = yield service_1.Service.findOne({
            where: { TeamId: req.team.id, UserId: req.id },
        });
        if (alreadyService) {
            return res.status(200).json({
                code: 'OK',
                message: `동아리 ${req.team.name}의 서비스 사용 설정값 입니다.`,
                payload: alreadyService,
            });
        }
        return res.status(404).json({
            code: 'Not found',
            message: `동아리 ${req.team.name}의 서비스 사용 설정값이 없습니다.`,
        });
    }
    catch (e) {
        next(e);
    }
}));
router.post('/service', authToken_1.default, authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { tweet, pray, penalty, } = req.body;
    try {
        const alreadyService = yield service_1.Service.findOne({
            where: { TeamId: req.team.id, UserId: req.id },
        });
        if (alreadyService) {
            return res.status(409).json({
                code: 'Conflict',
                message: '이미 서비스 사용 설정이 초기화 되었습니다.',
            });
        }
        yield service_1.Service.create({
            tweet,
            pray,
            penalty,
            TeamId: req.team.id,
            UserId: req.id,
        });
        return res.json({
            message: `동아리 ${req.team.name}의 서비스 사용 설정이 초기화 되었습니다.`,
            code: 'OK',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.post('/phoneToken', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneToken } = req.body;
    console.log('yoyo');
    try {
        yield user_1.User.update({
            phoneToken,
        }, { where: { id: req.id } });
        return res.status(200).json({
            message: `회원님의 phoneToken 정보를 성공적으로 수정하였습니다.`,
            code: 'OK',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.patch('/paycheck', authToken_1.default, authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // body에 teamId 넣어야함!
    const { id, payed } = req.body;
    try {
        yield penalty_1.Penalty.update({ payed }, {
            where: {
                id,
                weekend: date_1.default.thisWeekendToString(),
            },
        });
        return res.status(200).json({
            code: 'OK',
            message: `(${date_1.default.thisWeekendToString()}) 유저의 벌금 제출값이 성공적으로 변경되었습니다.`,
        });
    }
    catch (e) {
        next(e);
    }
}));
router.patch('/phoneToken', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneToken } = req.body;
        yield user_1.User.update({ phoneToken }, { where: { id: req.id } });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.get('/team/:teamId/penaltys/:lastId', authToken_1.default, authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lastId: lstId } = req.params;
        try {
            const where = { id: {}, UserId: req.id, TeamId: req.team.id };
            const lastId = parseInt(lstId, 10);
            if (lastId && lastId !== -1) {
                where.id = { [sequelize_1.Op.lt]: lastId };
            }
            const penaltys = yield penalty_1.Penalty.findAll({
                where: lastId === -1 ? { UserId: req.id, TeamId: req.team.id } : where,
                limit: 10,
                order: [['id', 'DESC']],
            });
            if (penaltys.length === 10) {
                return res.status(200).json({
                    code: 'OK',
                    payload: penaltys,
                    message: `회원번호 ${req.id} 유저의 트윗 목록입니다.`,
                });
            }
            else {
                return res.status(200).json({
                    code: 'OK:LAST',
                    payload: penaltys,
                    message: `회원번호 ${req.id} 유저의 마지막 페이지 트윗 목록입니다.`,
                });
            }
        }
        catch (e) {
            console.error(e);
            next(e);
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.get('/team/:teamId/tweets/:lastId', authToken_1.default, authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { lastId: lstId } = req.params;
    const lastId = parseInt(lstId, 10);
    try {
        const where = { id: {}, UserId: req.id, TeamId: req.team.id };
        if (lastId !== -1) {
            where.id = { [sequelize_1.Op.lt]: lastId };
        }
        console.log(where);
        const tweets = yield tweet_1.Tweet.findAll({
            where: lastId === -1 ? { UserId: req.id, TeamId: req.team.id } : where,
            limit: 5,
            include: [
                {
                    model: user_1.User,
                    attributes: ['id', 'img', 'name', 'oauth', 'createdAt'],
                },
            ],
            order: [['id', 'DESC']],
        });
        if (tweets.length === 5) {
            return res.json({
                code: 'OK',
                payload: tweets,
                message: `회원번호 ${req.id} 유저의 트윗 목록입니다.`,
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: tweets,
                message: `회원번호 ${req.id} 유저의 마지막 페이지 트윗 목록입니다.`,
            });
        }
    }
    catch (e) {
        console.error(e);
        next(e);
    }
}));
router.get('/team/:teamId/prays/:lastId', authToken_1.default, authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { lastId: lstId } = req.params;
    const lastId = parseInt(lstId, 10);
    try {
        const where = { id: {}, UserId: req.id, TeamId: req.team.id };
        if (lastId && lastId !== -1) {
            where.id = { [sequelize_1.Op.lt]: lastId };
        }
        const prays = yield pray_1.Pray.findAll({
            where: lastId === -1 ? { UserId: req.id, TeamId: req.team.id } : where,
            limit: 15,
            order: [['id', 'DESC']],
        });
        if (prays.length === 15) {
            return res.json({
                code: 'OK',
                payload: prays,
                message: `회원번호 ${req.id} 유저의 기도제목 목록입니다.`,
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: prays,
                message: `회원번호 ${req.id} 유저의 마지막 페이지 기도제목 목록입니다.`,
            });
        }
    }
    catch (e) {
        console.error(e);
        next(e);
    }
}));
router.get('/team/thumbnail', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.User.findOne({ where: { id: req.id } });
        const payload = yield user.getTeams({
            limit: 5,
            order: [['createdAt', 'DESC']],
        });
        return res.json({
            code: 'OK',
            payload,
            message: `${req.name}님이 가입한 팀의 썸네일 목록입니다.`,
        });
    }
    catch (e) {
        console.error(e);
        next(e);
    }
}));
router.get('/team/lastId/:lastId', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lastId: stringLastId } = req.params;
        const lastId = parseInt(stringLastId, 10);
        let where = {};
        if (lastId !== -1) {
            where.id = { [sequelize_1.Op.lt]: lastId };
        }
        const user = yield user_1.User.findOne({ where: { id: req.id } });
        const teams = yield user.getTeams({
            where,
            limit: 15,
            order: [['createdAt', 'DESC']],
        });
        if (teams.length === 15) {
            return res.json({
                code: 'OK',
                payload: teams,
                message: `${req.name}님이 가입한 팀 목록입니다.`,
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: teams,
                message: `${req.name}님이 가입한 마지막 팀 목록입니다.`,
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.get('/invitation/:lastId', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lastId: stringLastId } = req.params;
        const lastId = parseInt(stringLastId, 10);
        const invitations = yield invitation_1.Invitation.findAll({
            where: lastId !== -1
                ? { UserId: req.id, id: { [sequelize_1.Op.lt]: lastId }, active: true }
                : { UserId: req.id, active: true },
            limit: 15,
            order: [['createdAt', 'DESC']],
            include: [{ model: team_1.Team, attributes: ['id', 'name', 'img'] }],
        });
        if (invitations.length === 15) {
            return res.json({
                code: 'OK',
                payload: invitations,
                message: '유저가 받은 초대 목록입니다.',
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: invitations,
                message: `유저가 받은 초대 마지막 목록입니다.`,
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.get('/application/:lastId', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lastId: stringLastId } = req.params;
        const lastId = parseInt(stringLastId, 10);
        const applications = yield invitation_1.Invitation.findAll({
            where: lastId !== -1
                ? { UserId: req.id, id: { [sequelize_1.Op.lt]: lastId }, active: false }
                : { UserId: req.id, active: false },
            limit: 15,
            order: [['createdAt', 'DESC']],
            include: [{ model: team_1.Team, attributes: ['id', 'name', 'img'] }],
        });
        if (applications.length === 15) {
            return res.json({
                code: 'OK',
                payload: applications,
                message: '유저가 신청한 팀 목록입니다.',
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: applications,
                message: '유저가 신청한 팀 마지막 목록입니다.',
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.get('/invitation/thumbnail/:active', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { active } = req.params;
        const invitations = yield invitation_1.Invitation.findAll({
            where: { UserId: req.id, active: active === 'true' ? true : false },
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                { model: team_1.Team, attributes: ['id', 'name', 'img', 'introducing'] },
            ],
        });
        return res.json({
            code: 'OK',
            payload: invitations,
            message: active
                ? '유저가 받은 초대 썸네일 목록 입니다.'
                : '가입 신청한 팀 썸네일 목록입니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.delete('/withdraw', authToken_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tweets = yield tweet_1.Tweet.findAll({
            where: { UserId: req.id },
        });
        const user = yield user_1.User.findOne({ where: { id: req.id } });
        const myteams = yield user.getTeams({ where: { bossId: req.id } });
        if (myteams.length !== 0) {
            return res.status(403).send({
                code: 'Forbidden',
                message: `먼저 ${req.name}님이 생성한 팀들을 삭제해주세요.`,
            });
        }
        let error = false;
        tweets.map((tweet) => {
            fs_1.default.rm(tweet.img.replace('img', 'src/uploads'), (err) => err ? (error = true) : console.log('삭제완료'));
        });
        if (error) {
            return res
                .status(500)
                .json({ message: '서버에러입니다.', code: 'Delete Error' });
        }
        const teams = yield user.getTeams();
        yield Promise.all(teams.map((team) => __awaiter(void 0, void 0, void 0, function* () {
            yield user.removeTeam(team.id);
            yield team.removeUser(req.id);
        })));
        yield tweet_1.Tweet.destroy({
            where: {
                UserId: req.id,
            },
        });
        yield penalty_1.Penalty.destroy({
            where: {
                UserId: req.id,
            },
        });
        yield pray_1.Pray.destroy({
            where: {
                UserId: req.id,
            },
        });
        yield service_1.Service.destroy({
            where: {
                UserId: req.id,
            },
        });
        yield user_1.User.destroy({ where: { id: req.id }, force: true, cascade: true });
        return res.status(200).send({
            code: 'OK',
            message: '계정이 삭제되었습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
exports.default = router;
