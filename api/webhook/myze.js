// api/webhook/myze.js
// Vercel URL: https://myze-adapter.vercel.app/api/webhook/myze
// → Diese URL in Myze Custom Store Connector als Webhook URL eintragen

import { getRawBody, verifyMyzeSignature } from "../_myze.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers["x-myze-webhook-signature"];
  const timestamp = req.headers["x-myze-webhook-timestamp"];

  if (!verifyMyzeSignature(rawBody, signature, timestamp)) {
    console.warn("[Myze] Ungültige Webhook-Signatur");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { eventType, data } = JSON.parse(rawBody);
  console.log(`[Myze] Webhook: ${eventType}`);

  if (eventType === "fulfillmentOrder.shipped") {
    console.log(`[Myze] Bestellung versendet:`, JSON.stringify(data, null, 2));
    // TODO: Tracking-E-Mail an Käufer senden
    // Tracking-Daten sind in data.location / data.items verfügbar
  }

  if (eventType === "fulfillmentOrder.created") {
    console.log(`[Myze] Bestellung in Produktion: ${data.id}`);
  }

  return res.status(200).json({ received: true });
}
