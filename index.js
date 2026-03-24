import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import express from "express";

const app = express();
const CLUB_ID = "490340";

let cache = null;

// 🔥 funzione principale
async function fetchStats() {
  try {
    console.log("Fetching stats...");

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // evita timeout
    await page.setDefaultNavigationTimeout(0);

    // user agent realistico
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // 🔥 chiamata API dentro browser (bypass Akamai)
    const data = await page.evaluate(async (clubId) => {
      const res = await fetch(
        `https://proclubs.ea.com/api/fc/clubs/overallStats?platform=common-gen5&clubIds=${clubId}`,
        {
          headers: {
            "Accept": "application/json",
            "Referer": "https://www.ea.com/",
            "Origin": "https://www.ea.com"
          }
        }
      );

      return res.json();
    }, CLUB_ID);

    await browser.close();

    const club = data?.clubs?.[CLUB_ID];

    if (!club) {
      console.log("❌ Nessun dato trovato");
      return;
    }

    cache = {
      goals: club.goals,
      wins: club.wins,
      gamesPlayed: club.gamesPlayed,
      losses: club.losses,
      draws: club.ties,
      updated: new Date().toISOString()
    };

    console.log("✅ UPDATED:", cache);

  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

// 🔁 aggiorna ogni 10 minuti
setInterval(fetchStats, 10 * 60 * 1000);

// 🚀 primo avvio
fetchStats();

// 📡 API endpoint
app.get("/stats", (req, res) => {
  if (!cache) return res.json({ loading: true });
  res.json(cache);
});

// 🔥 porta Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});