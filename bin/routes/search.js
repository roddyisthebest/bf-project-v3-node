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
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const sequelize_1 = require("sequelize");
const team_1 = require("../model/team");
const user_1 = require("../model/user");
const router = express_1.default.Router();
router.get('/teams/:keyword/:lastId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, lastId: stringLastId } = req.params;
        const pureKeyword = (0, sanitize_html_1.default)(keyword);
        const lastId = parseInt(stringLastId, 10);
        let where = {};
        if (pureKeyword !== 'no-data') {
            where.name = { [sequelize_1.Op.like]: `%${pureKeyword}%` };
        }
        if (lastId !== -1) {
            where.id = {
                [sequelize_1.Op.lt]: lastId,
            };
        }
        const teams = yield team_1.Team.findAll({
            limit: 15,
            where,
            order: [['createdAt', 'DESC']],
        });
        if (teams.length === 15) {
            return res.json({
                code: 'OK',
                payload: teams,
                message: `이름이 ${keyword}가 포함된 팀들의 정보입니다.`,
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: teams,
                message: `이름이 ${keyword}가 포함된 팀들의 마지막 정보입니다.`,
            });
        }
    }
    catch (e) {
        console.log(e);
        next(e);
    }
}));
router.get('/users/:keyword', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword } = req.params;
    try {
        const pureKeyword = (0, sanitize_html_1.default)(keyword);
        const users = yield user_1.User.findAll({
            where: {
                name: { [sequelize_1.Op.like]: `%${pureKeyword}%` },
                id: { [sequelize_1.Op.ne]: req.id },
            },
            attributes: ['id', 'name', 'img'],
        });
        return res.status(200).json({
            code: 'OK',
            message: `이름이 ${keyword}가 포함된 유저들의 정보입니다.`,
            payload: users,
        });
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
