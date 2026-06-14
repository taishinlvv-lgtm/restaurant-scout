const fs = require("fs");
const path = require("path");

function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

function importCSV() {
  const inputDir = path.join(__dirname, "../../data/input");
  const processedDir = path.join(__dirname, "../../data/processed");
  const results = [];

  if (!fs.existsSync(inputDir)) return results;

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".csv"));

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(content);

    for (const row of rows) {
      const website = row.website || row.Website || row["ウェブサイト"] || "";
      if (!website) {
        results.push({
          name: row.name || row.Name || row["店名"] || "不明",
          address: row.address || row.Address || row["住所"] || "",
          phone: row.phone || row.Phone || row["電話番号"] || "不明",
          category: row.category || row.Category || row["カテゴリ"] || "飲食店",
          area: row.area || row.Area || row["エリア"] || "",
          source: "csv",
          hasWebsite: false
        });
      }
    }

    fs.renameSync(filePath, path.join(processedDir, file));
    console.log(`CSV取込完了: ${file}`);
  }

  return results;
}

module.exports = { importCSV };
