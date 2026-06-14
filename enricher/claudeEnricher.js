const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function enrichRestaurant(restaurant) {
  const prompt = `
以下の飲食店情報をもとに、ウェブサイト制作のための情報を生成してください。
JSON形式のみで返してください。

店舗情報:
- 店名: ${restaurant.name}
- 住所: ${restaurant.address}
- 電話: ${restaurant.phone}
- カテゴリ: ${restaurant.category}
- エリア: ${restaurant.area}

以下のJSONを返してください（他のテキスト不要）:
{
  "catchCopy": "キャッチコピー（20文字以内）",
  "description": "店舗の魅力（60文字以内）",
  "designDirection": "デザイン方向性",
  "colorScheme": "推奨カラー",
  "salesPitch": "オーナーへの営業トーク（100文字以内）",
  "priority": "高/中/低"
}
`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text.trim();
    const json = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { ...restaurant, ...json };
  } catch (e) {
    console.log(`Enrich error (${restaurant.name}): ${e.message}`);
    return {
      ...restaurant,
      catchCopy: "地域の名店",
      description: "地元で愛される飲食店",
      designDirection: "シンプルで見やすいデザイン",
      colorScheme: "白と黒",
      salesPitch: "ウェブサイトで集客力アップをご提案します",
      priority: "中"
    };
  }
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
