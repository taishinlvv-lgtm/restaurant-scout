const https = require("https");

const SHEET_URL = process.env.GOOGLE_SHEET_URL;

function postToSheet(sheetName, row) {
  return new Promise((resolve) => {
    if (!SHEET_URL) {
      console.log("GOOGLE_SHEET_URL未設定 - スキップ");
      return resolve();
    }

    const data = JSON.stringify({ sheet: sheetName, row });
    const url = new URL(SHEET_URL);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };

    const req = https.request(options, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => resolve(body));
    });

    req.on("error", e => {
      console.log(`Sheets error: ${e.message}`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

async function writeToSheets(restaurants) {
  const today = new Date().toLocaleDateString("ja-JP");

  for (const r of restaurants) {
    await postToSheet("見込み客", [
      today,
      r.name,
      r.category,
      r.area,
      r.address,
      r.phone,
      r.priority || "中",
      r.catchCopy || "",
      r.salesPitch || "",
      r.source
    ]);

    await postToSheet("作業ログ", [
      today,
      "ヒビキ",
      `新規見込み客追加: ${r.name}（${r.category}/${r.area}）`,
      `優先度: ${r.priority || "中"}`
    ]);

    await new Promise(res => setTimeout(res, 500));
  }

  console.log(`${restaurants.length}件をGoogle Sheetsに書き込みました`);
}

module.exports = { writeToSheets };
