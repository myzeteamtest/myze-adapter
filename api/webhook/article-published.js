// api/webhook/article-published.js
// Vercel URL: https://myze-adapter.vercel.app/api/webhook/article-published
// → Diese URL in Myze Custom Store Connector für ArticlePublished eintragen

import { getRawBody, verifyMyzeSignature } from "../_myze.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers["x-myze-webhook-signature"];
  const timestamp = req.headers["x-myze-webhook-timestamp"];

  if (!verifyMyzeSignature(rawBody, signature, timestamp)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data } = JSON.parse(rawBody);
  console.log(`[Myze] Artikel publiziert: ${data.articleName}`);

  // Produktdaten für den Shop aufbereiten
  const shopProduct = {
    id: data.variants?.[0]?.sku || data.articleId,
    name: data.articleName,
    description: data.articleDescription || "",
    variants: (data.variants || []).map((v) => ({
      sku: v.sku,
      color: v.color,
      size: v.size,
      price: v.price.amount / 100,
      currency: v.price.currency,
      image:
        v.facePreviews?.find((f) => f.faceName === "front")?.previewImageUrl ||
        v.facePreviews?.[0]?.previewImageUrl ||
        null,
    })),
  };

  console.log("[Shop] Produkt aufbereitet:", JSON.stringify(shopProduct, null, 2));

  return res.status(200).json({ received: true, product: shopProduct });
}
