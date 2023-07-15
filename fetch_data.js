const axios = require("axios");
const fs = require("fs");

if(!fs.existsSync("surah")) fs.mkdirSync("surah");

const START_AT = 1;
const START = Date.now();

(async() => {
  const {
    data: {
      data: surah
    }
  } = await axios("https://web-api.qurankemenag.net/quran-surah");

  for(const i of surah) {
    const { id } = i;
    if(START_AT > id) continue;

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

    await fs.promises.writeFile(`surah/${id}.json`, JSON.stringify(i, null, 2));
    console.log(`Berhasil menambahkan surah ${i.transliteration} (${id})`);
  };
  const END = Date.now();
  console.log("Berhasil menambahkan semua surah kedalam folder surah/\nSelesai dalam:", (END - START) + "ms");
})();
