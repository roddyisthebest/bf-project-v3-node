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
const report_1 = require("../model/report");
const authAdmin_1 = __importDefault(require("../middleware/authAdmin"));
const tweet_1 = require("../model/tweet");
const pray_1 = require("../model/pray");
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
router.get('/:lastId', authAdmin_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lastId } = req.params;
        let where = {};
        if (lastId !== -1) {
            where.id = {
                [sequelize_1.Op.lt]: lastId,
            };
        }
        const reports = yield report_1.Report.findAll({
            limit: 10,
            where,
            order: [['createdAt', 'DESC']],
        });
        if (reports.length === 10) {
            return res.json({
                code: 'OK',
                payload: reports,
                message: `신고 리스트들입니다.`,
            });
        }
        else {
            return res.json({
                code: 'OK:LAST',
                payload: reports,
                message: `마지막 신고 리스트들입니다.`,
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.get('/tweet/:id', authAdmin_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tweet = yield tweet_1.Tweet.findOne({ where: { id: req.params.id } });
        if (tweet) {
            return res.status(200).json({
                code: 'OK',
                message: `게시글 정보입니다.`,
                payload: tweet,
            });
        }
        else {
            return res.status(404).json({
                code: 'Not Found',
                message: `게시글 정보가 없습니다.`,
                payload: tweet,
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.get('/pray/:id', authAdmin_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pray = yield pray_1.Pray.findOne({ where: { id: req.params.id } });
        if (pray) {
            return res.status(200).json({
                code: 'OK',
                message: `기도제목입니다.`,
                payload: pray,
            });
        }
        else {
            return res.status(404).json({
                code: 'Not Found',
                message: `기도제목이 없습니다.`,
                payload: pray,
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.post('', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content, model } = req.body;
        yield report_1.Report.create({ content, model, UserId: req.id });
        return res.status(201).json({
            code: 'Created',
            message: '성공적으로 신고가 접수되었습니다.',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.delete('/tweet/:id', authAdmin_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tweet = yield tweet_1.Tweet.findOne({ where: { id: req.params.id } });
        if (tweet) {
            yield tweet_1.Tweet.destroy({ where: { id: req.params.id } });
            let error = false;
            fs_1.default.rm(tweet === null || tweet === void 0 ? void 0 : tweet.img.replace('src/img', 'uploads'), (err) => err ? (error = true) : console.log('good'));
            if (!error) {
                return res.status(200).json({
                    code: '200',
                    message: '해당 트윗의 삭제가 완료되었습니다!',
                });
            }
            else {
                return res
                    .status(500)
                    .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
            }
        }
        else {
            return res.status(404).json({
                code: 'Not Found',
                message: `게시글 정보가 없습니다.`,
                payload: tweet,
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
router.delete('/pray/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pray = yield pray_1.Pray.findOne({ where: { id: req.params.id } });
        if (pray) {
            yield pray_1.Pray.destroy({ where: { id: req.params.id } });
            return res.status(200).json({
                code: 'OK',
                message: '해당 기도제목의 삭제가 완료되었습니다!',
            });
        }
        else {
            return res.status(404).json({
                code: 'Not Found',
                message: '삭제되었거나 없는 기도제목입니다.',
            });
        }
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
