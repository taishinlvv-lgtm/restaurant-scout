const https = require("https");

const SHEET_URL = process.env.GOOGLE_SHEET_URL;

function postToSheet(payload) {
  return new Promise((resolve) => {
    if (!SHEET_URL) {
      console.log("GOOGLE_SHEET_URL not set - skip");
      return resolve();
    }
    let u;
    try {
      u = new URL(SHEET_URL);
    } catch (e) {
      console.log("GOOGLE_SHEET_URL invalid");
      return resolve();
    }
    const data = JSON.stringify(payload);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    });
    req.on("error", (e) => {
      console.log("Sheets error: " + e.message);
      resolve();
    });
    req.on("timeout", () => {
      req.destroy();
      resolve();
    });
    req.write(data);
    req.end();
  });
}

async function writeToSheets(restaurants) {
  const today = new Date().toLocaleDateString("ja-JP");
  let added = 0;
  let skipped = 0;

  for (const r of restaurants) {
    const memo = r.shopUrl ? "詳細・電話確認: " + r.shopUrl : "";
    const dedupeInfo = { name: r.name, area: r.area };

    const result = await postToSheet({
      sheet: "案件管理",
      dedupe: dedupeInfo,
      row: [
        today,
        r.name,
        r.area,
        r.phone,
        r.category,
        r.priority || "中",
        "見込み",
        r.salesPitch || "",
        "",
        memo,
        "",
        "",
      ],
    });

    if (result && result.indexOf("DUPLICATE") !== -1) {
      skipped++;
    } else {
      added++;
      await postToSheet({
        sheet: "作業ログ",
        row: [
          today,
          "ヒビキ",
          "新規見込み客追加: " + r.name + "（" + r.category + "/" + r.area + "）",
          "優先度: " + (r.priority || "中"),
        ],
      });
    }

    await new Promise((res) => setTimeout(res, 500));
  }

  console.log("案件管理シート: 新規" + added + "件 / 重複スキップ" + skipped + "件");
}

module.exports = { writeToSheets };
