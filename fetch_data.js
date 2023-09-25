const axios = require("axios");
const fs = require("fs");

if(!fs.existsSync("surah")) fs.mkdirSync("surah");
if(!fs.existsSync("juz")) fs.mkdirSync("juz");

(async() => {
  const START_DL = Date.now();
  const {
    data: {
      data: surah
    }
  } = await axios("https://web-api.qurankemenag.net/quran-surah");
  const alls = [];

  for(const i of surah) {
    const { id } = i;

    delete i.id;
    delete i.page;
    delete i.updated_at;

    const {
      data: {
        data: ayah
      }
    } = await axios(`https://web-api.qurankemenag.net/quran-ayah?start=0&limit=286&surah=${id}`);
    for(const a of ayah) {
      delete a.id;
      delete a.surah_id;
      delete a.page;
      delete a.kitabah;
      delete a.arabic_words;
      delete a.updated_at;
      delete a.surah;
    };
    i.ayah = ayah;

    alls.push(i);
    await fs.promises.writeFile(`surah/${id}.json`, JSON.stringify(i, null, 2));
    console.log(`Berhasil menambahkan surah ${i.transliteration} (${id})`);
  };
  const END_DL = Date.now();
  console.log("Berhasil menambahkan semua surah kedalam folder surah/\nSedang mengisi juz/");

  const START_JUZ = Date.now();
  const _all = {};
  let i = 0;
  for(const surah of alls) {
    for(const ayah of surah.ayah) {
      const data = {
        no: ++i,
        arabic: ayah.arabic,
        latin: ayah.latin,
        translation: ayah.translation
      };
      if(!_all[ayah.juz]) {
        i = 1;
        _all[ayah.juz] = [];
      };
      _all[ayah.juz].push(data);
    };
  };
  for(const juz in _all) {
    const data = _all[juz];
    await fs.promises.writeFile(`juz/${juz}.json`, JSON.stringify(data, null, 2));
    console.log(`Berhasil menambahkan juz ${juz} (${data.length} ayat)`);
  };

  const END_JUZ = Date.now();
  console.log(
    "Berhasil menambahkan semua juz kedalam folder juz/\n\nSelesai menambahkan surah dalam:",
    (END_DL - START_DL) + "ms\nSelesai menambahkan juz dalam:",
    (END_JUZ - START_JUZ) + "ms\nTotal:",
    ((END_DL - START_DL) + (END_JUZ - START_JUZ)) + "ms"
  );
})();
