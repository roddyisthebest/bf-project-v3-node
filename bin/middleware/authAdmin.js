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
Object.defineProperty(exports, "__esModule", { value: true });
const authAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user.admin) {
        return res.status(403).json({
            code: 'Forbidden:AuthAdmin',
            message: '관리자 계정이 아닙니다.',
        });
    }
    return next();
});
exports.default = authAdmin;
