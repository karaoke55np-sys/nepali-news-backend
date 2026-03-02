import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();

app.use(cors());

// ===============================
// SETOPATI SCRAPER
// ===============================
async function scrapeSetopati() {
  try {
    const response = await axios.get("https://www.setopati.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const articles = [];

    $("a").each((i, el) => {
      const title = $(el).text().replace(/\s+/g, " ").trim();
      let link = $(el).attr("href");

      if (
        title.length > 40 &&
        link &&
        !link.includes("#") &&
        !title.toLowerCase().includes("subscribe") &&
        !title.toLowerCase().includes("login")
      ) {
        if (!link.startsWith("http")) {
          link = "https://www.setopati.com" + link;
        }

        articles.push({
          title,
          link,
          source: "Setopati"
        });
      }
    });

    return articles.slice(0, 8);
  } catch (error) {
    return [];
  }
}

// ===============================
// ONLINEKHABAR SCRAPER
// ===============================
async function scrapeOnlineKhabar() {
  try {
    const response = await axios.get("https://www.onlinekhabar.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const articles = [];

    $("a").each((i, el) => {
      const title = $(el).text().replace(/\s+/g, " ").trim();
      let link = $(el).attr("href");

      if (
        title.length > 40 &&
        link &&
        !link.includes("#") &&
        !title.toLowerCase().includes("login")
      ) {
        if (!link.startsWith("http")) {
          link = "https://www.onlinekhabar.com" + link;
        }

        articles.push({
          title,
          link,
          source: "OnlineKhabar"
        });
      }
    });

    return articles.slice(0, 8);
  } catch (error) {
    return [];
  }
}

// ===============================
// API ROUTE
// ===============================
app.get("/api/news", async (req, res) => {
  try {
    const [setopati, online] = await Promise.all([
      scrapeSetopati(),
      scrapeOnlineKhabar()
    ]);

    let combined = [...setopati, ...online];

    // Remove duplicates by title
    const seen = new Set();
    combined = combined.filter(article => {
      const cleanTitle = article.title.toLowerCase();
      if (seen.has(cleanTitle)) return false;
      seen.add(cleanTitle);
      return true;
    });

    res.json({
      success: true,
      count: combined.length,
      data: combined
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Scraping failed"
    });
  }
});

export default app;