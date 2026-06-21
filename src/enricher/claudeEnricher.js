const https = require("https");

// XmousyTimeの強み（営業文の核）
const COMPANY_STRENGTH =
  "XmousyTimeの強み: (1) 今はほぼ全員がスマホで店を探す時代。スマホで見やすいモバイルファーストのサイトを作る。" +
  "(2) ただ作るだけでなく、多くの人に見てもらう集客・表示速度の最適化まで提供する。" +
  "(3) 優秀な開発者とデザイナーが、見た目の美しさと集客力の両方を実現する。";

function callClaude(restaurant) {
  const isHigh = restaurant.priority === "高";

  const prompt = isHigh
    ? "あなたはWeb制作会社XmousyTimeの優秀な営業担当ハヤトです。以下の飲食店は客単価が高く、Web制作費を払える体力がある優良見込み客です。この店のオーナーに送る、丁寧で説得力のある営業文を作成してください。\n\n" +
      COMPANY_STRENGTH + "\n\n" +
      "店名: " + restaurant.name + "\n" +
      "エリア: " + restaurant.area + "\n" +
      "ジャンル: " + restaurant.category + "\n" +
      "客単価: " + (restaurant.budget || "不明") + "\n\n" +
      "営業文の方針: ホームページがないことの機会損失に触れ、スマホ対応と集客支援という自社の強みを活かして集客力アップを具体的に提案する。250字程度。JSON形式のみで返す。\n" +
      '{"catchCopy":"キャッチコピー20字以内","description":"店舗の魅力60字以内","designDirection":"デザイン方向性","colorScheme":"推奨カラー","salesPitch":"営業文250字程度"}'
    : "あなたはWeb制作会社XmousyTimeの営業担当ハヤトです。以下の飲食店オーナーに送る簡潔な営業文を作成してください。\n\n" +
      COMPANY_STRENGTH + "\n\n" +
      "店名: " + restaurant.name + "\n" +
      "エリア: " + restaurant.area + "\n" +
      "ジャンル: " + restaurant.category + "\n\n" +
      "営業文の方針: スマホ対応と集客支援という強みを簡潔に伝える。120字程度。JSON形式のみで返す。\n" +
      '{"catchCopy":"キャッチコピー20字以内","description":"店舗の魅力60字以内","designDirection":"デザイン方向性","colorScheme":"推奨カラー","salesPitch":"営業文120字程度"}';

  const fallback = {
    catchCopy: "地域の名店",
    description: "地元で愛される飲食店",
    designDirection: "シンプルで見やすいデザイン",
    colorScheme: "白と黒",
    salesPitch: "スマホで見やすいサイト制作と集客支援をご提案します",
  };

  return new Promise((resolve) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log("ANTHROPIC_API_KEY not set - fallback");
      return resolve(Object.assign({}, restaurant, fallback));
    }

    const data = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          const text = json.content[0].text.trim();
          const result = JSON.parse(text.replace(/```json|```/g, "").trim());
          resolve(Object.assign({}, restaurant, result));
        } catch (e) {
          console.log("parse error (" + restaurant.name + "): " + e.message);
          resolve(Object.assign({}, restaurant, fallback));
        }
      });
    });

    req.on("error", (e) => {
      console.log("API error (" + restaurant.name + "): " + e.message);
      resolve(Object.assign({}, restaurant, fallback));
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(Object.assign({}, restaurant, fallback));
    });

    req.write(data);
    req.end();
  });
}

async function enrichAll(restaurants) {
  const results = [];
  for (const r of restaurants) {
    console.log("情報生成中: " + r.name + "（優先度" + r.priority + "）");
    const enriched = await callClaude(r);
    results.push(enriched);
    await new Promise((res) => setTimeout(res, 1000));
  }
  return results;
}

module.exports = { enrichAll };
