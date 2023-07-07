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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const tweet_1 = require("../model/tweet");
const service_1 = require("../model/service");
const date_1 = __importDefault(require("../util/date"));
const authTeam_1 = __importDefault(require("../middleware/authTeam"));
const router = express_1.default.Router();
try {
    fs_1.default.readdirSync('uploads');
}
catch (error) {
    fs_1.default.mkdirSync('uploads');
}
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
router.post('/team/:teamId', authTeam_1.default, upload.single('img'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield user_1.User.findOne({
            where: { id: req.id },
            include: [
                {
                    model: service_1.Service,
                    where: {
                        TeamId: req.team.id,
                    },
                },
            ],
        });
        const img = ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || '';
        const { content: pureContent } = req.body;
        const content = (0, sanitize_html_1.default)(pureContent);
        console.log(content);
        let error = false;
        if (!(img || content)) {
            return res
                .status(400)
                .json({ message: '잘못된 형식의 data입니다.', code: 'Bad Request' });
        }
        if (!user.Service.tweet) {
            fs_1.default.rm(img, (err) => (err ? (error = true) : (error = false)));
            if (error) {
                console.log('서비스엄슴.');
                return res
                    .status(500)
                    .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
            }
            else {
                return res.status(403).json({
                    code: 'Forbidden',
                    message: `${user.name}님은 게시글을 업로드하는 서비스를 이용하지 않으셨습니다.`,
                });
            }
        }
        const alreadyTweet = yield tweet_1.Tweet.findOne({
            where: {
                UserId: req.id,
                TeamId: req.team.id,
                createdAt: {
                    [sequelize_1.Op.between]: [date_1.default.startOfToday(), date_1.default.endOfToday()],
                },
            },
        });
        // if (alreadyTweet) {
        //   fs.rm(img, (err) => (err ? (error = true) : (error = false)));
        //   if (error) {
        //     return res
        //       .status(500)
        //       .json({ code: 'Bad Gateway', message: '파일 삭제 오류입니다.' });
        //   } else {
        //     return res.status(406).json({
        //       code: 'Forbidden',
        //       message: '오늘 업로드 된 게시물이 존재합니다.',
        //     });
        //   }
        // }
        yield tweet_1.Tweet.create({
            UserId: req.id,
            TeamId: req.team.id,
            content: content && content,
            img: img && img.replace('uploads', 'src/img'),
            weekend: date_1.default.thisWeekendToString(),
        });
        return res.status(200).json({
            code: 'OK',
            message: '성공적으로 업로드 되었습니다.',
        });
    }
    catch (e) {
        next(e);
    }
}));
router.get('/:lastId/team/:teamId', authTeam_1.default, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lastId = parseInt(req.params.lastId, 10);
        const where = { id: {}, TeamId: req.team.id };
        console.log(lastId);
        if (lastId !== -1) {
            where.id = { [sequelize_1.Op.lt]: lastId };
        }
        const tweets = yield tweet_1.Tweet.findAll({
            where: lastId === -1 ? { TeamId: req.team.id } : where,
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: user_1.User, attributes: ['id', 'name', 'img', 'oauth'] }],
        });
        if (tweets.length === 5) {
            return res.status(200).json({
                code: 'OK',
                payload: tweets,
                message: `동아리 번호 ${req.params.teamId}의 트윗 목록 입니다.`,
            });
        }
        else {
            return res.status(200).json({
                code: 'OK:LAST',
                payload: tweets,
                message: `동아리 번호 ${req.params.teamId}의 마지막 트윗 목록 입니다.`,
            });
        }
    }
    catch (e) {
        console.error(e);
        next(e);
    }
}));
router.delete('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const tweet = yield tweet_1.Tweet.findOne({
            where: { id },
            include: [{ model: user_1.User, attributes: ['id'] }],
        });
        if (!tweet) {
            return res.status(404).json({
                code: 'Not Found',
                message: '삭제되었거나 없는 게시글입니다.',
            });
        }
        const user = tweet === null || tweet === void 0 ? void 0 : tweet.User;
        var error = false;
        if (req.id === user.id) {
            yield tweet_1.Tweet.destroy({ where: { id } });
            if (tweet.img.length != 0) {
                fs_1.default.rm(tweet === null || tweet === void 0 ? void 0 : tweet.img.replace('src/img', 'uploads'), (err) => err ? (error = true) : console.log('good'));
            }
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
            return res
                .status(403)
                .json({ code: 'Forbidden', message: '권한이 없습니다.' });
        }
    }
    catch (e) {
        console.error(e);
        next(e);
    }
}));
exports.default = router;
