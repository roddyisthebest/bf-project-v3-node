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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token_1 = require("../util/token");
const authToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = req.headers.authorization;
    console.log('accessToken', accessToken);
    jsonwebtoken_1.default.verify(accessToken, token_1.publicKey, (error, user) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    code: 'Expired:AccessToken',
                    message: 'accessToken이 만료되었습니다. refreshToken으로 accessToken을 갱신해주세요.',
                });
            }
            else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    code: 'Invalid AccessToken',
                    message: '유효하지 않은 토큰입니다.',
                });
            }
            else {
                return res.status(400).json({
                    message: '에러입니다!',
                    code: 'Bad Request:Token',
                });
            }
        }
        else {
            req.user = user;
            req.id = user.id;
            req.name = user.name;
            next();
        }
    });
});
exports.default = authToken;
