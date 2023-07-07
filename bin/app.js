"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const model_1 = require("./model");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const user_1 = __importDefault(require("./routes/user"));
const pray_1 = __importDefault(require("./routes/pray"));
const penalty_1 = __importDefault(require("./routes/penalty"));
const tweet_1 = __importDefault(require("./routes/tweet"));
const token_1 = __importDefault(require("./routes/token"));
const team_1 = __importDefault(require("./routes/team"));
const search_1 = __importDefault(require("./routes/search"));
const report_1 = __importDefault(require("./routes/report"));
const authToken_1 = __importDefault(require("./middleware/authToken"));
const func_1 = require("./util/func");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const HTTP_PORT = 4000;
const HTTPS_PORT = 443;
const app = (0, express_1.default)();
dotenv_1.default.config();
process.env.GOOGLE_APPLICATION_CREDENTIALS =
    'src/bf-project-v3-firebase-adminsdk-vikyp-ed16b4f5cf.json';
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    databaseURL: 'https://bf-project-v3.firebaseio.com',
});
app.use((0, cors_1.default)({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use('/src/img', express_1.default.static(path_1.default.join('uploads')));
model_1.sequelize
    .sync({ force: false })
    .then(() => console.log('데이터 베이스 연결 성공했다리요!'))
    .catch((err) => {
    console.log(err);
});
(0, func_1.settingPenalty)();
(0, func_1.givingWarning)();
app.use('/user', user_1.default);
app.use('/report', authToken_1.default, report_1.default);
app.use('/pray', authToken_1.default, pray_1.default);
app.use('/penalty', authToken_1.default, penalty_1.default);
app.use('/tweet', authToken_1.default, tweet_1.default);
app.use('/token', token_1.default);
app.use('/team', authToken_1.default, team_1.default);
app.use('/search', authToken_1.default, search_1.default);
app.get('/', (req, res, next) => {
    return res.status(200).json({ message: 'test' });
});
app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    console.log('라우터가 없습니다.');
    next(error);
});
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'prod' ? err : {};
    res.status(500);
    console.log('error');
    console.log(err.message, 'File too large');
    console.log(err.message === 'File too large');
    if (err.message === 'File too large') {
        return res.status(413).json({ code: 413, message: err.message });
    }
    res.json({ code: 500, message: err.message });
});
if (process.env.NODE_ENV === 'production') {
    //
}
else {
    app.listen(HTTP_PORT, () => {
        console.log(`running on port ${HTTP_PORT}`);
    });
}
