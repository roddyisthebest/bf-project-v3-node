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
const penalty_1 = require("../model/penalty");
const user_1 = require("../model/user");
const sequelize_1 = require("sequelize");
const service_1 = require("../model/service");
const date_1 = __importDefault(require("../util/date"));
const authTeam_1 = __importDefault(require("../middleware/authTeam"));
const authBoss_1 = __importDefault(require("../middleware/authBoss"));
const router = express_1.default.Router();
router.get('/:lastId/team/:teamId', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const where = { id: {} };
        const lastId = parseInt(req.params.lastId, 10);
        if (lastId !== -1) {
            where.id = { [sequelize_1.Op.lt]: lastId };
        }
        const penaltys = yield user_1.User.findAll({
            include: [
                {
                    model: penalty_1.Penalty,
                    where: {
                        weekend: { [sequelize_1.Op.eq]: date_1.default.thisWeekendToString() },
                        TeamId: req.team.id,
                    },
                },
                {
                    model: service_1.Service,
                    where: {
                        penalty: { [sequelize_1.Op.ne]: false },
                    },
                    attributes: [],
                },
            ],
            order: [['id', 'DESC']],
            limit: 5,
            where: lastId === -1 ? {} : where,
        });
        if (penaltys.length === 5) {
            return res.json({
                code: 'OK',
                payload: penaltys,
                message: `동아리 ${req.team.name}의 ${date_1.default.thisWeekendToString()} 기간의 벌금 목록입니다.`,
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: penaltys,
                message: `동아리 번호 ${req.team.name}의 ${date_1.default.thisWeekendToString()} 기간의 마지막 벌금 목록입니다.`,
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.patch('', authTeam_1.default, authBoss_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paper, id } = req.body;
        yield penalty_1.Penalty.update({
            paper,
        }, { where: { id } });
        return res.json({
            code: 'OK',
            message: '성공적으로 Penalty 정보가 변경되었습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
exports.default = router;
