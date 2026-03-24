import puppeteer from "puppeteer";
import express from "express";

const app = express();
const CLUB_ID = "490340";

let cache = null;

async function fetchStats() {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto("https://www.ea.com/", {
      waitUntil: "networkidle2"
    });

    const data = await page.evaluate(async (clubId) => {
      const res = await fetch(
        `https://proclubs.ea.com/api/fc/clubs/overallStats?platform=common-gen5&clubIds=${clubId}`
      );
      return res.json();
    }, CLUB_ID);

    await browser.close();

    const club = data.clubs?.[CLUB_ID];

    cache = {
      goals: club?.goals || 0,
      wins: club?.wins || 0,
      gamesPlayed: club?.gamesPlayed || 0,
      updated: new Date().toISOString()
    };

    console.log("UPDATED:", cache);

  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

// aggiorna ogni 10 minuti
setInterval(fetchStats, 10 * 60 * 1000);

// prima esecuzione
fetchStats();

// API endpoint
app.get("/stats", (req, res) => {
  if (!cache) return res.json({ loading: true });
  res.json(cache);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Server running on", PORT));