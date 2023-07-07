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
const authBoss = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.id !== parseInt(req.team.bossId, 10)) {
        return res.status(403).json({
            code: 'Forbidden:AuthBoss',
            message: '팀에대한 권한이 없습니다.',
        });
    }
    return next();
});
exports.default = authBoss;
