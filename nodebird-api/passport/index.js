const passport = require("passport");
const local = require("./localStrategy");
const kakao = require("./kakaoStrategy");
const User = require("../models/user");

module.exports = () => {
  passport.serializeUser((user, done) => {
    //req.login메서드가 호출 매 로그인 시 마다, req.session객체에 어떤 데이터를 저장할지 정하는 메서드
    done(null, user.id); // 세션에 user의 id만 저장
  });

  passport.deserializeUser((id, done) => {
    //serializeUser에서 세션에 저장했던 아이디를 받아 데이터베이스에서 사용자의 정보를 가져옴
    //passport.session 미들웨어가 이 메서드를 호출
    //매 요청시 실행,
    User.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Followers",
        },
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Followings",
        },
      ],
    })
      .then((user) => done(null, user)) //req.user에 저장
      .catch((err) => done(err));
  });
  local();
  //passport.authenticate("local")  localStrategy.js로 이동
  kakao();
};
