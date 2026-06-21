const https = require("https");

const API_KEY = process.env.HOTPEPPER_API_KEY;

const AREAS = ["Z011", "Z014"];
const GENRES = ["G007", "G013", "G014"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchApi(urlStr) {
  return new Promise((resolve) => {
    https.get(urlStr, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    }).on("error", (e) => {
      console.log(`API error: ${e.message}`);
      resolve("");
    });
  });
}

async function searchByGenreArea(genre, area) {
  const results = [];
  const url =
    `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/` +
    `?key=${API_KEY}&large_area=${area}&genre=${genre}` +
    `&count=20&format=json`;

  const body = await fetchApi(url);
  if (!body) return results;

  try {
    const json = JSON.parse(body);
    const shops = (json.results && json.results.shop) || [];
    for (const shop of shops) {
      results.push({
        name: shop.name,
        area: shop.middle_area ? shop.middle_area.name : area,
        phone: "不明",
        category: shop.genre ? shop.genre.name : "飲食店",
        priority: "中",
        address: shop.address || "",
        salesPitch: "",
        // 店舗詳細ページURL（営業時に電話番号・地図を確認できる）
        shopUrl: (shop.urls && shop.urls.pc) || "",
      });
    }
  } catch (e) {
    console.log(`JSON parse error: ${e.message}`);
  }

  return results;
}

async function runHotpepperScraper() {
  if (!API_KEY) {
    console.log("HOTPEPPER_API_KEY未設定 - スキップ");
    return [];
  }

  const allResults = [];
  for (const genre of GENRES) {
    for (const area of AREAS) {
      console.log(`検索中: ジャンル${genre} × エリア${area}`);
      const results = await searchByGenreArea(genre, area);
      allResults.push(...results);
      console.log(`  → ${results.length}件取得`);
      await sleep(1000);
    }
  }

  console.log(`ホットペッパー合計: ${allResults.length}件`);
  return allResults;
}

module.exports = { runHotpepperScraper };
