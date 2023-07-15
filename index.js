const cookieParser = require("cookie-parser");
const express = require("express");
const fs = require("fs");

const __exit = (message) => {
  console.log(message);
  process.exit(1);
};
if(!fs.existsSync("surah")) __exit("Wajib mengambil data dari web kemenag saat pertama kali!\n\nJalankan `node fetch_data.js`");
if(fs.readdirSync("surah").length !== 114) __exit("Terdeteksi file surah belum lengkap, jalankan perintah ini:\n`node fetch_data.js`");

const app = express();
const api = express.Router();
app.use((req, res, next) => {
  const _req = Date.now()
  res.on("finish", () => {
    const _end = Date.now()
    const total = _end - _req

    console.log(req.method, req.originalUrl, res.statusCode, total+"ms")
  });
  next();
})
app.use(cookieParser());
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

app.get("/", (req, res) => {
  const { theme } = req.cookies;
  if(!theme) res.cookie("theme", "light");

  res.render("index", {
    listSurah,
    theme: theme || "light"
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


app.listen(8080, () => console.log("Server Al-Qur'an berjalan pada port 8080"));
