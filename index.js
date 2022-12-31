const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const dbconn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const generateAccessToken = (username) => {
  return jwt.sign(
    {
      type: "JWT",
      username: username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m", // 15분후 만료
      issuer: process.env.ISSUER,
    }
  );
};

const generateRefreshToken = (username) => {
  return jwt.sign(
    {
      type: "JWT",
      username: username,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "365 days",
      issuer: process.env.ISSUER,
    }
  );
};

const login = async (username, password) => {
  const sql = "SELECT * FROM user WHERE id=?";

  dbconn.query(sql, username, async function (err, rows) {
    if (err) console.log(err);

    const dbPassowrd = user[0].password;
    const passwordcompare = await bcrypt.compare(password, dbPassowrd);

    return passwordcompare;
  });

  if (passwordcompare) {
    return Buffer.from(username, "base64").toString("utf8");
  } else {
    return "";
  }
};

const register = (username, password, master) => {
  if (master === process.env.MASTER) {
    const encryptedPassowrd = bcrypt.hashSync(password, 10);
    const sql = "INSERT INTO user VALUES (?, ?)";
    let params = [username, encryptedPassowrd];

    return dbconn.query(sql, params, function (err, rows) {
      if (err) {
        console.log(err);
        return "";
      } else return "OK";
    });
  } else return "";
};

app.get("/", (req, res) => {
  res.send(process.env.ISSUER);
});

app.post("/login", (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;

  username = Buffer.from(username, "utf8").toString("base64");

  let user = login(username, password);
  if (user === "") return res.sendStatus(401);

  let accessToken = generateAccessToken(user);
  let refreshToken = generateRefreshToken(user);

  return res.status(200).json({ accessToken, refreshToken });
});

app.post("/register", (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  let master = req.body.master;

  username = Buffer.from(username, "utf8").toString("base64");

  let user = register(username, password, master);
  if (user === "") return res.sendStatus(401);

  return res.status(200);
});

app.listen(5001);
