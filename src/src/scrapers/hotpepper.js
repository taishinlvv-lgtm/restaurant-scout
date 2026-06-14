const axios = require("axios");
const cheerio = require("cheerio");

const SEARCH_KEYWORDS = [
  "焼肉", "ラーメン", "喫茶店", "居酒屋", "定食", "寿司", "うどん", "そば"
];

const AREAS = [
  "横浜", "川崎", "渋谷", "新宿", "池袋", "品川", "目黒", "世田谷"
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeHotpepper(keyword, area) {
  const results = [];
  const url = `https://www.hotpepper.jp/SA${encodeURIComponent(area)}/genre/${encodeURIComponent(keyword)}/`;

  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 10000
    });

    const $ = cheerio.load(res.data);

    $(".shopListCont").each((i, el) => {
      if (i >= 5) return false;

      const name = $(el).find(".shopName").text().trim();
      const address = $(el).find(".adr").text().trim();
      const phone = $(el).find(".tel").text().trim();
      const hasWebsite = $(el).find("a[href*='http']").filter((_, a) => {
        const href = $(a).attr("href") || "";
        return !href.includes("hotpepper") && !href.includes("line.me");
      }).length > 0;

      if (name && !hasWebsite) {
        results.push({
          name,
          address: address || area,
          phone: phone || "不明",
          category: keyword,
          area,
          source: "hotpepper",
          hasWebsite: false
        });
      }
    });

    await sleep(2000);
  } catch (e) {
    console.log(`Hotpepper error (${keyword}/${area}): ${e.message}`);
  }

  return results;
}

async function runHotpepperScraper() {
  const allResults = [];

  for (const keyword of SEARCH_KEYWORDS.slice(0, 3)) {
    for (const area of AREAS.slice(0, 2)) {
      console.log(`検索中: ${keyword} × ${area}`);
      const results = await scrapeHotpepper(keyword, area);
      allResults.push(...results);
      await sleep(3000);
    }
  }

  return allResults;
}

module.exports = { runHotpepperScraper };
