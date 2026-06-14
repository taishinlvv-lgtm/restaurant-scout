require("dotenv").config();
const cron = require("node-cron");
const { runHotpepperScraper } = require("./scrapers/hotpepper");
const { importCSV } = require("./scrapers/csvImporter");
const { enrichAll } = require("./enricher/claudeEnricher");
const { writeToSheets } = require("./output/googleSheets");

async function runScout() {
  console.log("====================================");
  console.log(`開始: ${new Date().toLocaleString("ja-JP")}`);
  console.log("====================================");

  try {
    console.log("\nホットペッパー検索中...");
    const hotpepperResults = await runHotpepperScraper();
    console.log(`  → ${hotpepperResults.length}件取得`);

    console.log("\nCSV取込中...");
    const csvResults = importCSV();
    console.log(`  → ${csvResults.length}件取得`);

    const allRestaurants = [...hotpepperResults, ...csvResults];

    if (allRestaurants.length === 0) {
      console.log("\n新規店舗なし - 終了");
      return;
    }

    console.log(`\nClaude APIで情報生成中（${allRestaurants.length}件）...`);
    const enriched = await enrichAll(allRestaurants);

    console.log("\nGoogle Sheetsに書き込み中...");
    await writeToSheets(enriched);

    console.log(`\n完了！合計${enriched.length}件処理しました`);

  } catch (e) {
    console.error(`エラー: ${e.message}`);
  }
}

if (process.argv.includes("--test")) {
  console.log("テストモードで実行");
  runScout();
} else {
  console.log("スケジューラー起動 - 毎日AM9:00 JSTに実行");
  cron.schedule("0 0 * * *", () => {
    runScout();
  });
  runScout();
}
