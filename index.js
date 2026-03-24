import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import express from "express";

const app = express();
const CLUB_ID = "490340";

let cache = null;

async function fetchStats() {
  try {
    console.log("Fetching stats...");

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath, // 🔥 QUESTO È FONDAMENTALE
      headless: chromium.headless
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    );

    await page.goto("https://www.ea.com/", {
      waitUntil: "networkidle2"
    });

    let data = null;

    page.on("response", async (response) => {
    const url = response.url();

    if (url.includes("overallStats")) {
        try {
        data = await response.json();
        console.log("✅ INTERCEPTED DATA");
        } catch (e) {
        console.log("Parse error");
        }
    }
    });

    // 👇 apri pagina EA clubs (IMPORTANTE)
    await page.goto("https://www.ea.com/games/ea-sports-fc/clubs/overview", {
    waitUntil: "networkidle2"
    });

    // 👇 aspetta un attimo per intercettare
    await new Promise(r => setTimeout(r, 8000));

    await browser.close();

    const club = data.clubs?.[CLUB_ID];

    cache = {
      goals: club?.goals || 0,
      wins: club?.wins || 0,
      gamesPlayed: club?.gamesPlayed || 0,
      updated: new Date().toISOString()
    };

    console.log("✅ UPDATED:", cache);

  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

// ogni 10 min
setInterval(fetchStats, 10 * 60 * 1000);

// primo run
fetchStats();

app.get("/stats", (req, res) => {
  if (!cache) return res.json({ loading: true });
  res.json(cache);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));