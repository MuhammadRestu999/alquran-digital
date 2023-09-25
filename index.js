const cookieParser = require("cookie-parser");
const express = require("express");
const fs = require("fs");

const __exit = (message) => {
  console.log(message);
  process.exit(1);
};
if(!fs.existsSync("surah") || !fs.existsSync("juz")) __exit("Wajib mengambil data dari web kemenag saat pertama kali!\n\nJalankan `node fetch_data.js`");
if(fs.readdirSync("surah").length !== 114 || fs.readdirSync("juz").length !== 30) __exit("Terdeteksi file surah atau juz belum lengkap, jalankan perintah ini:\n`node fetch_data.js`");

const app = express();
const api = express.Router();
app.use(cookieParser());
app.use((req, res, next) => {
  const { theme } = req.cookies;
  if(!theme) res.cookie("theme", "light", {
    maxAge: 31104000000
  });

  req.theme = theme || "light";

  const _req = Date.now()
  res.on("finish", () => {
    const _end = Date.now()
    const total = _end - _req

    console.log(req.method, req.originalUrl, res.statusCode, total+"ms")
  });
  next();
})
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use("/api", api);

const listSurah = fs.readdirSync("surah/").sort((a, b) => a.slice(0, -5) - b.slice(0, -5)).map((v) => {
  const json = {
    id: v.slice(0, -5) * 1,
    ...JSON.parse(fs.readFileSync("surah/" + v))
  };
  delete json.ayah;
  return json
});
const listJuz = fs.readdirSync("juz/").sort((a, b) => a.slice(0, -5) - b.slice(0, -5)).map((v) => {
  return JSON.parse(fs.readFileSync("juz/" + v));
});


app.get("/", (req, res) => {
  res.render("index", {
    listSurah,
    theme: req.theme
  });
});
app.get("/juz", (req, res) => {
  res.render("juz", {
    listJuz,
    theme: req.theme
  });
});
app.get("/donasi.png", (req, res) => {
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="donasi_${Date.now()}.png"`);
  res.status(200).send(fs.readFileSync("public/src/qris.png"));
});
app.get("/donasi", (req, res) => {
  res.render("donasi", {
    theme: req.theme
  });
});
app.get("/surah/:no", (req, res, next) => {
  const { no } = req.params;
  if(!/^[0-9]+$/.test(no) || no > 114) return next();

  const data = {
    id: no,
    ...JSON.parse(fs.readFileSync(`surah/${no}.json`))
  };
  res.render("surah", {
    theme: req.theme,
    data
  });
});
app.get("/juz/:no", (req, res, next) => {
  const { no } = req.params;
  if(!/^[0-9]+$/.test(no) || no > 30) return next();

  const data = JSON.parse(fs.readFileSync(`juz/${no}.json`));
  res.render("surah2", {
    theme: req.theme,
    no,
    data
  });
});
app.get("/bookmarks", (req, res) => {
  res.render("bookmarks", {
    listSurah,
    theme: req.theme
  });
});
app.get("/asmaulhusna", (req, res) => {
  res.render("asmaulhusna", {
    listSurah,
    theme: req.theme
  });
});

api.get(["/surah/:no", "/surah/:no/:ayat"], (req, res) => {
  const { no, ayat } = req.params;
  if(no === "lists") return res.status(200).send(listSurah);
  if(!/^[0-9]+$/.test(no)) return res.status(400).send({
    status: 400,
    message: "Hanya menerima angka"
  });
  if(ayat && !/^[0-9]+$/.test(ayat)) return res.status(400).send({
    status: 400,
    message: "Hanya menerima angka"
  });
  if(no > 114) return res.status(400).send({
    status: 400,
    message: "Hanya ada 114 surah dalam Al-Qur'an :|"
  });

  const data = JSON.parse(fs.readFileSync(`surah/${no}.json`));
  if(ayat && !data.ayah.find(v => v.ayah == ayat)) return res.status(404).send({
    status: 404,
    message: `Tidak ada ayat ${ayat} di surah ${data.latin}`
  });

  if(ayat) res.status(200).send(data.ayah.find(v => v.ayah == ayat));
  else res.status(200).send(data);
});
api.get("/juz/:no", (req, res) => {
  const { no } = req.params;
  if(!/^[0-9]+$/.test(no)) return res.status(400).send({
    status: 400,
    message: "Hanya menerima angka"
  });
  if(no > 30) return res.status(400).send({
    status: 400,
    message: "Hanya ada 30 juz dalam Al-Qur'an :|"
  });

  const data = JSON.parse(fs.readFileSync(`juz/${no}.json`));
  res.status(200).send(data);
});

// 404 Handle
app.use((req, res) => {
  res.status(404).render("404", {
    theme: req.theme
  });
});

app.listen(process.env.PORT || 8080, () => console.log("Server Al-Qur'an berjalan pada port", process.env.PORT || 8080));
