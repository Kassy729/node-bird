const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");

const router = express.Router();

router.post("/join", isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect("/join?error=exist");
      // 가입한 사용자가 있다면 회워가입페이지로 되돌려보냄
      //주소 뒤에 에러를 쿼리스트링으로 표시
    }
    const hash = await bcrypt.hash(password, 12);
    //가입한 사용자가 없다면 비밀번호를 암호화해서 저장, 12는 반복횟수
    await User.create({
      email,
      nick,
      password: hash,
    });
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return next(error);
  }
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (authError, user, info) => {
    //localStrategy.js를 수행, local()
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      //passport.serializeUser 호출
      if (loginError) {
        console.log(loginError);
        return next(loginError);
      }
      //세션 쿠키를 브라우저로 전송
      return res.redirect("/");
    });
  })(req, res, next); //미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

router.get("/kakao", passport.authenticate("kakao"));

router.get(
  "/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/", //카카오 로그인 실패시 어디로 이동할지 작성
  }),
  (req, res) => {
    res.redirect("/");
  }
);

module.exports = router;
