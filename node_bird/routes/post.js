const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { Post, Hashtag } = require("../models");
const { isLoggedIn } = require("./middlewares");

const router = express.Router();

try {
  fs.readdirSync("uploads"); //uploads인 폴더를 노드프로젝트에서 탐색한다,
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}

const upload = multer({
  storage: multer.diskStorage({
    //어디에
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      //req : 요청에대한 정보, file : 업로드한 파일에 대한 정보
      //어떤이름으로 저장할지
      const ext = path.extname(file.originalname); //파일 확장자 추출후 출력
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext); //파일명 추출시 확장자 제외후 출력
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/img", isLoggedIn, upload.single("img"), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();

router.post("/", isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]*/g); //해쉬태그 추출
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) => {
          return Hashtag.findOrCreate({
            //해쉬태그가 데이터베이스에 존재하면 가져오고 없으면 생성 후 가져옴
            where: { title: tag.slice(1).toLowerCase() }, //#을 때고 소문자로 변경
          });
        })
      );
      await post.addHashtags(result.map((r) => r[0]));
    }
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
