// api/products.js
import { getProducts } from "./_myze.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  let products = await getProducts();

  // Upstash gibt manchmal einen doppelt-serialisierten String zurück
  // Solange es ein String ist, nochmal parsen
  while (typeof products === "string") {
    try { products = JSON.parse(products); } catch { break; }
  }

  if (!Array.isArray(products)) products = [];

  return res.status(200).json(products);
}
