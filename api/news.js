import express from "express";
import axios from "axios";
import cheerio from "cheerio";

const app = express();

async function scrapeSetopati() {
  try {
    const response = await axios.get("https://www.setopati.com", {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const articles = [];

    $("a").each((i, el) => {
      const title = $(el).text().trim();
      let link = $(el).attr("href");

      if (title.length > 40 && link && !link.includes("#")) {
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

    return articles.slice(0, 10);
  } catch (error) {
    return [];
  }
}

app.get("/api/news", async (req, res) => {
  try {
    const news = await scrapeSetopati();

    res.json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Scraping failed"
    });
  }
});

export default app;