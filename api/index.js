const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

let newsCache = [];
let mediaCache = [];
let lastScrapeTime = null;
let lastMediaScrapeTime = null;

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRandomPublishedTime() {
    const now = new Date();
    return new Date(now.getTime() - Math.floor(Math.random() * 24) * 3600000);
}

function determineCategory(text) {
    text = text.toLowerCase();
    if (text.includes('राजनीति') || text.includes('politics')) return 'politics';
    if (text.includes('खेल') || text.includes('sports')) return 'sports';
    if (text.includes('अर्थ') || text.includes('business')) return 'economy';
    if (text.includes('मनोरञ्जन') || text.includes('movie')) return 'entertainment';
    return 'general';
}

function getCategoryNepali(category) {
    const names = {
        politics: 'राजनीति',
        sports: 'खेलकुद',
        economy: 'अर्थ',
        entertainment: 'मनोरञ्जन',
        general: 'सामान्य'
    };
    return names[category] || 'सामान्य';
}

// ============================================
// SIMPLE NEWS SCRAPER (FAST FOR VERCEL)
// ============================================

async function scrapeSetopati() {
    try {
        const response = await axios.get('https://www.setopati.com', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000
        });

        const $ = cheerio.load(response.data);
        const articles = [];

        $('a').each((i, el) => {
            const title = $(el).text().trim();
            let link = $(el).attr('href');

            if (title && title.length > 40 && link) {
                if (!link.startsWith('http')) {
                    link = 'https://www.setopati.com' + link;
                }

                const publishedTime = generateRandomPublishedTime();

                articles.push({
                    id: Date.now() + Math.random(),
                    title,
                    summary: title.substring(0, 150) + '...',
                    link,
                    source: 'Setopati',
                    category: determineCategory(title),
                    categoryNepali: getCategoryNepali(determineCategory(title)),
                    publishedTimestamp: publishedTime.getTime()
                });
            }
        });

        return articles.slice(0, 15);

    } catch (error) {
        return [];
    }
}

async function scrapeOnlinekhabar() {
    try {
        const response = await axios.get('https://www.onlinekhabar.com', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000
        });

        const $ = cheerio.load(response.data);
        const articles = [];

        $('a').each((i, el) => {
            const title = $(el).text().trim();
            let link = $(el).attr('href');

            if (title && title.length > 40 && link) {
                if (!link.startsWith('http')) {
                    link = 'https://www.onlinekhabar.com' + link;
                }

                const publishedTime = generateRandomPublishedTime();

                articles.push({
                    id: Date.now() + Math.random(),
                    title,
                    summary: title.substring(0, 150) + '...',
                    link,
                    source: 'Onlinekhabar',
                    category: determineCategory(title),
                    categoryNepali: getCategoryNepali(determineCategory(title)),
                    publishedTimestamp: publishedTime.getTime()
                });
            }
        });

        return articles.slice(0, 15);

    } catch (error) {
        return [];
    }
}

async function scrapeAllNews() {
    const [setopati, onlinekhabar] = await Promise.allSettled([
        scrapeSetopati(),
        scrapeOnlinekhabar()
    ]);

    let allArticles = [
        ...(setopati.status === 'fulfilled' ? setopati.value : []),
        ...(onlinekhabar.status === 'fulfilled' ? onlinekhabar.value : [])
    ];

    allArticles.sort((a, b) => b.publishedTimestamp - a.publishedTimestamp);

    return allArticles;
}

// ============================================
// API ROUTES
// ============================================

app.get('/api/news', async (req, res) => {
    try {
        if (!lastScrapeTime || (Date.now() - lastScrapeTime) > 5 * 60 * 1000) {
            newsCache = await scrapeAllNews();
            lastScrapeTime = Date.now();
        }

        res.json({
            success: true,
            count: newsCache.length,
            data: newsCache
        });

    } catch (error) {
        res.json({ success: false, data: [] });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        newsArticles: newsCache.length,
        lastUpdated: lastScrapeTime
    });
});

// ============================================
// EXPORT FOR VERCEL
// ============================================

module.exports = app;