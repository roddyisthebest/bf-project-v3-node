"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
    development: {
        username: 'root',
        password: 'bsy30228',
        database: 'bf3',
        host: '127.0.0.1',
        dialect: 'mysql',
        timezone: '+09:00',
    },
};
