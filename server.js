// server.js
import express from "express";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let urls = {}; 


app.post("/shorturls", (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  if (!url) return res.status(400).json({ error: "URL is required" });

  let code = shortcode || crypto.randomBytes(3).toString("hex");

  if (urls[code]) return res.status(400).json({ error: "Shortcode already exists" });

  const expiry = new Date(Date.now() + validity * 60000).toISOString();

  urls[code] = {
    originalUrl: url,
    createdAt: new Date().toISOString(),
    expiry,
    clicks: []
  };

  res.status(201).json({
    shortLink: `http://localhost:${PORT}/${code}`,
    expiry
  });
});


app.get("/shorturls/:code", (req, res) => {
  const { code } = req.params;
  const data = urls[code];

  if (!data) return res.status(404).json({ error: "Shortcode not found" });

  res.json({
    totalClicks: data.clicks.length,
    originalUrl: data.originalUrl,
    createdAt: data.createdAt,
    expiry: data.expiry,
    clicks: data.clicks
  });
});


app.get("/:code", (req, res) => {
  const { code } = req.params;
  const data = urls[code];

  if (!data) return res.status(404).json({ error: "Shortcode not found" });
  if (new Date() > new Date(data.expiry)) return res.status(410).json({ error: "Link expired" });

  data.clicks.push({
    timestamp: new Date().toISOString(),
    source: req.headers["user-agent"],
    ip: req.ip
  });

  res.redirect(data.originalUrl);
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
