"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicKey = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const privateKey = {
    key: fs_1.default.readFileSync(path_1.default.join(__dirname, '../../private.pem'), 'utf8'),
    passphrase: 'bsy30228', // 비밀키 발급 시 입력했던 패스워드
};
exports.publicKey = fs_1.default.readFileSync(path_1.default.join(__dirname, '../../public.pem'), 'utf-8');
const token = {
    generateAccessToken: function (id, name) {
        const accessToken = jsonwebtoken_1.default.sign({ id, name }, privateKey, {
            expiresIn: '10 days',
            algorithm: 'RS256',
        });
        return accessToken;
    },
    generateRefreshToken: function (id, name) {
        return jsonwebtoken_1.default.sign({ id, name }, privateKey, {
            expiresIn: '100 days',
            algorithm: 'RS256',
        });
    },
};
exports.default = token;
