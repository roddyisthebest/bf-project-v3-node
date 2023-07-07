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
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const service_1 = require("../model/service");
const date_1 = __importDefault(require("../util/date"));
const team_1 = require("../model/team");
const authTeam_1 = __importDefault(require("../middleware/authTeam"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = express_1.default.Router();
router.get('/:lastId/team/:teamId/weekend/:weekend', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { weekend } = req.params;
    console.log('we here');
    const where = { id: {}, TeamId: req.team.id };
    const lastId = parseInt(req.params.lastId, 10);
    if (lastId !== -1) {
        where.id = { [sequelize_1.Op.lt]: lastId };
    }
    try {
        let arr = [];
        const team = yield team_1.Team.findOne({ where: { id: req.team.id } });
        const userList = yield team.getUsers({
            limit: 5,
            where: lastId === -1 ? {} : { id: { [sequelize_1.Op.lt]: lastId } },
            order: [['id', 'DESC']],
            include: [
                {
                    model: service_1.Service,
                    where: { pray: { [sequelize_1.Op.ne]: false }, TeamId: req.team.id },
                },
            ],
        });
        let filteredPrayList = [...userList];
        for (let i = 0; i < userList.length; i++) {
            const prayList = yield pray_1.Pray.findAll({
                where: {
                    UserId: userList[i].id,
                    TeamId: req.team.id,
                    weekend: { [sequelize_1.Op.eq]: weekend },
                },
            });
            if ((prayList === null || prayList === void 0 ? void 0 : prayList.length) === 0) {
                arr.push(filteredPrayList[i].id);
            }
            else {
                filteredPrayList[i].dataValues.Prays = (prayList === null || prayList === void 0 ? void 0 : prayList.length)
                    ? prayList
                    : [];
            }
        }
        if (filteredPrayList.length === 5) {
            return res.status(200).json({
                code: 'OK',
                payload: filteredPrayList,
                message: `동아리 ${req.team.name}의 ${weekend} 기간의 기도제목 목록입니다.`,
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: filteredPrayList,
                message: `동아리 ${req.team.name}의 ${weekend} 기간의 마지막 기도제목 목록입니다.`,
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.post('', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        const user = yield user_1.User.findOne({
            where: { id: userId },
            include: [
                {
                    model: service_1.Service,
                    where: { pray: { [sequelize_1.Op.ne]: false }, TeamId: req.team.id },
                },
            ],
        });
        if (!user) {
            return res.status(403).json({
                code: 'Forbidden:Service',
                message: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
            });
        }
        const prayList = yield pray_1.Pray.findAll({
            where: {
                UserId: user.id,
                TeamId: req.team.id,
                weekend: date_1.default.thisWeekendToString(),
            },
        });
        if (prayList.length === 15) {
            return res.status(403).json({
                code: 'Forbidden:ExceededPray',
                message: '한주에 15개 이상 기도제목을 업로드 할 수 없습니다.',
            });
        }
        const pray = yield pray_1.Pray.create({
            UserId: user.id,
            TeamId: req.team.id,
            weekend: date_1.default.thisWeekendToString(),
            content: '',
        });
        return res.status(200).json({
            code: 'OK',
            message: '형제자매님의 기도제목이 성공적으로 db에 저장되었으니 기도해주세요.',
            payload: {
                id: pray.id,
                weekend: pray.weekend,
                content: pray.content,
            },
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.patch('', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, content: pureContent } = req.body;
    const content = (0, sanitize_html_1.default)(pureContent);
    try {
        const user = yield user_1.User.findOne({
            where: { id: req.id },
            include: [
                {
                    model: service_1.Service,
                    where: { pray: { [sequelize_1.Op.ne]: false }, TeamId: req.team.id },
                },
            ],
        });
        if (!user) {
            return res.status(403).json({
                code: 'Forbidden',
                message: '회원님은 기도제목 서비스를 이용하지 않으셨습니다.',
            });
        }
        const pray = yield pray_1.Pray.findOne({ where: { id } });
        if (!pray) {
            return res.status(404).json({
                code: 'Not Found',
                message: '삭제되었거나 없는 기도제목입니다.',
            });
        }
        yield pray_1.Pray.update({ content }, { where: { id, TeamId: req.team.id } });
        return res.status(200).send({
            code: 'OK',
            message: '유저의 기도제목이 성공적으로 변경되었습니다.',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.post('/cheer', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, anonymity } = req.body;
        const id = parseInt(userId, 10);
        console.log('anonymity', anonymity);
        const user = yield req.team.getUsers({ where: { id } });
        if (user && user.length === 0) {
            return res.status(403).json({
                code: 'Forbidden',
                message: `${user[0].name}님은 팀 ${req.team.name}의 멤버가 아닙니다.`,
            });
        }
        else {
            yield firebase_admin_1.default.messaging().send({
                token: user[0].phoneToken,
                notification: {
                    title: '당신을 위한 기도 🙏🏻',
                    body: anonymity
                        ? `${user[0].name}님! 당신을 위해 누군가가 기도합니다.`
                        : `${user[0].name}님! ${req.name}님이 당신을 위해 기도합니다. `,
                },
                android: {
                    notification: {
                        channelId: 'default',
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
                        },
                    },
                },
            });
            return res.json({
                code: 'OK',
                message: '성공적으로 응원이 전해졌습니다.',
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.delete('/:id/team/:teamId', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const pray = yield pray_1.Pray.findOne({ where: { id } });
        if (!pray) {
            return res.status(404).json({
                code: 'Not Found',
                message: '삭제되었거나 없는 기도제목입니다.',
            });
        }
        yield pray_1.Pray.destroy({ where: { id, TeamId: req.team.id } });
        return res.status(200).json({
            code: 'OK',
            message: '해당 기도제목의 삭제가 완료되었습니다!',
        });
    }
    catch (e) {
        console.error(e);
        next(e);
    }
}));
exports.default = router;
