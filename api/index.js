const express = require("express");

const app = express();

app.get("/api/news", (req, res) => {
  res.json({ message: "API working successfully 🚀" });
});

module.exports = app;