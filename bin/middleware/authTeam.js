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
const team_1 = require("../model/team");
const authTeam = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let teamId;
        if (req.params.teamId) {
            teamId = parseInt(req.params.teamId, 10);
        }
        if (req.body.teamId) {
            teamId = parseInt(req.body.teamId, 10);
        }
        console.log('teamId', teamId);
        const team = yield team_1.Team.findOne({ where: { id: teamId } });
        if (team === null) {
            return res
                .status(404)
                .json({ code: 'Not Found:Team', message: '팀이 이미 삭제되었습니다.' });
        }
        console.log('req.id', req.id);
        const user = yield team.getUsers({
            where: { id: req.id },
        });
        if (user && user.length !== 0) {
            req.team = team;
            return next();
        }
        return res.status(403).json({
            code: 'Forbidden:AuthTeam',
            message: '권한이 없습니다.',
        });
    }
    catch (e) {
        console.log(e);
        next(e);
    }
});
exports.default = authTeam;
