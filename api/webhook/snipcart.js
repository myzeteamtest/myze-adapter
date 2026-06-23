// api/webhook/snipcart.js
// Vercel URL: https://myze-adapter.vercel.app/api/webhook/snipcart
// → Diese URL in Snipcart Dashboard unter: Account → Webhooks eintragen

import { getRawBody, mapSnipcartToMyze, placeOrderInMyze } from "../_myze.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Snipcart-Authentifizierung: Secret Key als Bearer Token
  const auth = req.headers["authorization"] || "";
  if (process.env.SNIPCART_SECRET_KEY && auth !== `Bearer ${process.env.SNIPCART_SECRET_KEY}`) {
    console.warn("[Snipcart] Ungültige Authentifizierung");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = await getRawBody(req);
  const { eventName, content } = JSON.parse(body);

  // Nur abgeschlossene Bestellungen verarbeiten
  if (eventName !== "order.completed") {
    return res.status(200).json({ received: true, processed: false, reason: `Event '${eventName}' ignoriert` });
  }

  console.log(`[Snipcart] Neue Bestellung: ${content.token}`);

  try {
    const myzeOrder = mapSnipcartToMyze(content);
    const result = await placeOrderInMyze(myzeOrder);
    console.log(`[Myze] Bestellung angelegt: ${result.orderId}`);
    return res.status(200).json({ received: true, processed: true, myzeOrderId: result.orderId });
  } catch (err) {
    console.error("[Fehler]", err.message);
    return res.status(500).json({ error: "Bestellung konnte nicht an Myze übermittelt werden." });
  }
}
