const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function scrapeTeamStore(baseUrl, currentPage, itemsPerPage) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const allProducts = [];
  let totalPages = null;

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    while (allProducts.length < itemsPerPage) {
      const pagedUrl = `${baseUrl}?pageSize=72&pageNumber=${currentPage}`;
      console.log(`🔄 Fetching page ${currentPage} for ${baseUrl}`);
      await page.goto(pagedUrl, { waitUntil: "networkidle2", timeout: 60000 });
      totalPages = await page.evaluate(extractTotalPages, itemsPerPage);

      const products = await page.evaluate(() => {
        const cards = document.querySelectorAll(".product-card");
        const items = [];

        cards.forEach((card) => {
          const title = card
            .querySelector(".product-card-title a")
            ?.innerText.trim();
          const price = card.querySelector(".money-value")?.innerText.trim();
          const image = card.querySelector(".product-image")?.src;

          if (title && price) {
            items.push({ title, price, image });
          }
        });

        return items;
      });

      if (products.length === 0) {
        console.log(`✅ No more products on page ${currentPage}. Done.`);
        break;
      }

      const remaining = itemsPerPage - allProducts.length;
      allProducts.push(...products.slice(0, remaining));
    }

    return { allProducts, totalPages };
  } catch (err) {
    console.error("Scraper error:", err.message);
    return allProducts;
  } finally {
    await browser.close();
  }
}

function extractTotalPages(itemsPerPage) {
  const selectors = [".pagination-total", ".results-count", ".product-count"];
  let element = null;

  for (const sel of selectors) {
    element = document.querySelector(sel);
    if (element) break;
  }

  if (!element) return null;

  const text = element.innerText;

  const match = text.match(/(?:of\s)?(\d+)(?:\sresults|\sitems)?/i);
  const totalItems = match ? parseInt(match[1], 10) : null;

  return totalItems ? Math.ceil(totalItems / itemsPerPage) : null;
}

module.exports = { scrapeTeamStore };
