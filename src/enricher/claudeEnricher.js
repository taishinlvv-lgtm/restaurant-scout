const https = require("https");

async function enrichRestaurant(restaurant) {
  const prompt = `以下の飲食店情報をもとに、ウェブサイト制作のための情報をJSON形式のみで返してください。

店舗情報:
- 店名: ${restaurant.name}
- 住所: ${restaurant.address}
- 電話: ${restaurant.phone}
- カテゴリ: ${restaurant.category}
- エリア: ${restaurant.area}

JSONのみ返してください:
{"catchCopy":"キャッチコピー20文字以内","description":"店舗の魅力60文字以内","designDirection":"デザイン方向性","colorScheme":"推奨カラー","salesPitch":"営業トーク100文字以内","priority":"高/中/低"}`;

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          const text = json.content[0].text.trim();
          const result = JSON.parse(text.replace(/```json|```/g, "").trim());
          resolve({ ...restaurant, ...result });
        } catch (e) {
          console.log(`Parse error: ${e.message}`);
          resolve({ ...restaurant, catchCopy: "地域の名店", description: "地元で愛される飲食店", designDirection: "シンプル", colorScheme: "白と黒", salesPitch: "ウェブサイトで集客力アップ", priority: "中" });
        }
      });
    });

    req.on("error", (e) => {
      console.log(`API error: ${e.message}`);
      resolve({ ...restaurant, catchCopy: "地域の名店", description: "地元で愛される飲食店", designDirection: "シンプル", colorScheme: "白と黒", salesPitch: "ウェブサイトで集客力アップ", priority: "中" });
    });

    req.write(data);
    req.end();
  });
}

async function enrichAll(restaurants) {
  const results = [];
  for (const r of restaurants) {
    console.log(`情報生成中: ${r.name}`);
    const enriched = await enrichRestaurant(r);
    results.push(enriched);
    await new Promise(res => setTimeout(res, 1000));
  }
  return results;
}

module.exports = { enrichAll };
