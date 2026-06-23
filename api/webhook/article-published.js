// api/webhook/article-published.js
// Myze ruft diese URL auf wenn ein Artikel publiziert wird.
// Der Artikel wird automatisch im Shop angezeigt.

import { getRawBody, verifyMyzeSignature, mapMyzeArticleToProduct, saveProduct } from "../_myze.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await getRawBody(req);
  const signature = req.headers["x-myze-webhook-signature"];
  const timestamp = req.headers["x-myze-webhook-timestamp"];

  if (!verifyMyzeSignature(rawBody, signature, timestamp)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data } = JSON.parse(rawBody);
  console.log(`[Myze] Artikel publiziert: ${data.articleName}`);

  const product = mapMyzeArticleToProduct(data);
  await saveProduct(product);

  console.log(`[Shop] Produkt gespeichert: ${product.name} (${product.variants.length} Varianten)`);
  return res.status(200).json({ received: true, product });
}
