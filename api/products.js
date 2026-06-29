// api/products.js
// Gibt alle Produkte als JSON zurück — der Shop lädt diese beim Öffnen.
// URL: https://myze-adapter.vercel.app/api/products

import { getProducts } from "./_myze.js";

export default async function handler(req, res) {
  // CORS erlauben damit myze.app die Daten laden darf
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const products = await getProducts();
  return res.status(200).json(products);
}
