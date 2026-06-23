// api/health.js
// Vercel URL: https://myze-adapter.vercel.app/api/health
// → Damit kannst du jederzeit prüfen ob der Adapter läuft

export default function handler(req, res) {
  res.status(200).json({ status: "ok", service: "myze-teamshop-adapter" });
}
