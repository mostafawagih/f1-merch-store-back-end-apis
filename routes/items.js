const express = require("express");
const { scrapeTeamStore } = require("../services/teamScraper.js");

const router = express.Router();

const teamUrls = {
  mercedes:
    "https://f1store.formula1.com/en/mercedes-amg-petronas-f1-team/t-10977535+z-9539237-2587371245",
  ferrari:
    "https://f1store.formula1.com/en/scuderia-ferrari/t-76758670+z-71034-984427031",
};

router.get("/", async (req, res) => {
  const result = {};

  await Promise.all(
    Object.entries(teamUrls).map(async ([team, url]) => {
      const products = await scrapeTeamStore(url);
      result[team] = products;
    })
  );

  res.json(result);
});

router.get("/team/:team", async (req, res) => {
  const team = req.params.team.toLowerCase();

  if (!teamUrls[team]) {
    return res.status(400).json({ error: "Unsupported team" });
  }

  const products = await scrapeTeamStore(teamUrls[team]);
  res.json(products);
});

router.get("/search", async (req, res) => {
  const { name, team } = req.query;

  if (!name)
    return res.status(400).json({ error: "Missing 'name' query parameter." });

  const result = {};

  const targets = team
    ? { [team.toLowerCase()]: teamUrls[team.toLowerCase()] }
    : teamUrls;

  await Promise.all(
    Object.entries(targets).map(async ([teamName, url]) => {
      const products = await scrapeTeamStore(url);
      const matched = products.filter((p) =>
        p.title.toLowerCase().includes(name.toLowerCase())
      );
      if (matched.length > 0) result[teamName] = matched;
    })
  );

  if (Object.keys(result).length === 0) {
    return res
      .status(404)
      .json({ message: `No items found matching "${name}".` });
  }

  res.json(result);
});

module.exports = router;
