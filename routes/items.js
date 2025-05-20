const express = require("express");
const { scrapeTeamStore } = require("../services/teamScraper.js");
const { TEAMS_URLS } = require("../constants.js");

const router = express.Router();

router.get("/team/:team", async (req, res) => {
  const team = req.params.team.toLowerCase();

  if (team === "all-teams") {
    await Promise.all(
      Object.entries(TEAMS_URLS).map(async ([team, url]) => {
        const products = await scrapeTeamStore(url);
        res.json(products);
      })
    );
  }

  if (!TEAMS_URLS[team]) {
    return res.status(400).json({ error: "Unsupported team" });
  }

  const products = await scrapeTeamStore(TEAMS_URLS[team]);
  res.json(products);
});

router.get("/search", async (req, res) => {
  const { name, team } = req.query;

  if (!name)
    return res.status(400).json({ error: "Missing 'name' query parameter." });

  const result = {};

  const targets = team
    ? { [team.toLowerCase()]: TEAMS_URLS[team.toLowerCase()] }
    : TEAMS_URLS;

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
