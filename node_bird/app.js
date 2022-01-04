const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");

dotenv.config();
const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const { sequelize } = require("./models");
const passportConfig = require("./passport"); // (passport/index.js) 파일은 경로 생략 가능

const app = express();
passportConfig(); //패스포트 설정
app.set("port", process.env.PORT || 8001); //포트번호 8000으로 설정
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
}); //nunjucks 설정

//sequelize란 nodeJS에서 mysql을 사용할 때 raw Query문을 사용하지 않고 더욱 쉽게 다룰 수 있도록 도와주는 라이브러리
sequelize
  .sync({ force: false })
  //default값이 false임, {force: true}할 경우 -> 테이블을 생성하고 존재할 경우 삭제
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(morgan("dev"));
/*
개발환경에서는 dev, 배포 환경에서는 combined를 사용한다.
dev 모드 기준으로 GET / 500 7.409 ms - 50 은 각각 [HTTP메서드][주소][HTTP상태코드][응답속도] - [응답바이트]
요청과 응답을 한번에 볼 수 있어서 편함
*/

app.use(express.static(path.join(__dirname, "public")));
//CSS파일 및 JavaScript 파일과 같은 정적 파일
//절대 경로로 사용하기 위해

app.use("/img", express.static(path.join(__dirname, "uploads")));
app.use(express.json()); //json요청을 제대로 받을 수 있다
app.use(express.urlencoded({ extended: false }));
//false면 기본으로 내장된 querystring 모듈을 사용하고
//true면 따로 설치가 필요한 qs 모듈을 사용하여 쿼리 스트링을 해석

//인증은 세션으로 하고 사용자의 식별자만 쿠키에 저장하는 것이 가장 안전한 방법
app.use(cookieParser(process.env.COOKIE_SECRET));
//쿠키는 서버가 아닌 브라우저(클라이언트)에 정보가 저장

app.use(
  session({
    resave: false, //세션이 변경되지 않아도 저장이 됨, false 권장
    saveUninitialized: false, //세션에 저장할 내역이 없더라도 처음부터 세션을 생성할지 설정
    secret: process.env.COOKIE_SECRET, //암호화하는데 사용하는 키

    //세션 쿠키 설정 (세션 관리 시 클라이언트에 보내는 쿠키)
    cookie: {
      httpOnly: true, //클라이언트에서 쿠키를 확인하지 못하도록 설정
      secure: false, //https가 아닌 환경에서도 사용할 수 있도록 설정, 배포시에는 true로
    },
  })
);

app.use(passport.initialize()); //요청(req)에 passport 설정을 심는다.
app.use(passport.session()); //req.session객체에 passport 정보를 저장, deserializeUser 호출

app.use("/", pageRouter);
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use("/user", userRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
}); //라우터에러

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
}); //에러발생

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});
