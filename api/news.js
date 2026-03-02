import express from "express";

const app = express();

app.get("/api/news", (req, res) => {
  res.json({
    success: true,
    message: "Express backend working 🚀"
  });
});

export default app;