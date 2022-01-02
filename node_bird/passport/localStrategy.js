const passport = require("passport");
const localStrategy = require("passport-local").Strategy; //passport-local 모듈에서 Strategy 생성자 호출
const bcrypt = require("bcrypt");

const User = require("../models/user");

module.exports = () => {
  passport.use(
    new localStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const exUser = await User.findOne({ where: { email } }); //일치하는 email을 확인
          if (exUser) {
            const result = await bcrypt.compare(password, exUser.password); //email이 있다면 비밀번호를 비교
            if (result) {
              done(null, exUser); //성공
            } else {
              done(null, false, { message: "비밀번호가 일치하지 않습니다." });
              //exUser 아이디는 일치하는데 비밀번호가 틀릴때
            }
          } else {
            done(null, false, { message: "가입되지 않은 회원입니다." });
            //비밀번호가  다를때
          }
        } catch (error) {
          console.error(error);
          done(erorr);
        }
      }
    )
  );
};
