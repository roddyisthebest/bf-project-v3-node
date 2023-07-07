"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token_1 = __importStar(require("../util/token"));
const router = express_1.default.Router();
router.post('/refresh', (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res
            .status(409)
            .json({ code: 'Conflict', message: '토큰이 없습니다.' });
    }
    jsonwebtoken_1.default.verify(refreshToken, token_1.publicKey, (error, user) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    code: 'Expired:RefreshToken',
                    message: 'refreshToken이 만료되었습니다. 다시 로그인해주세요.',
                });
            }
            else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    code: 'Invalid RefreshToken',
                    message: '유효하지 않은 토큰입니다.',
                });
            }
            else {
                return res.status(400).json({
                    code: 'Bad Request:Token',
                    message: '에러입니다!',
                });
            }
        }
        else {
            const accessToken = token_1.default.generateAccessToken(user.id, user.name);
            return res.status(200).send({
                message: '토큰이 성공적으로 갱신되었습니다!',
                payload: { accessToken },
                code: 200,
            });
        }
    });
});
exports.default = router;
