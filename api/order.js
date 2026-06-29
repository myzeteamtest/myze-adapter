// api/order.js
// Nimmt eine Bestellung aus dem Teamshop-Formular entgegen
// und legt sie direkt in Myze als Draft an — ohne Zahlung.
// URL: https://myze-adapter.vercel.app/api/order
// Methode: POST
//
// Erwarteter Request Body (JSON):
// {
//   firstName: "Max",
//   lastName: "Mustermann",
//   email: "max@example.de",
//   phone: "+49 211 ...",          ← optional
//   street: "Sportplatzweg 4",
//   city: "Düsseldorf",
//   zip: "40210",
//   country: "DE",                 ← optional, Standard: DE
//   currency: "EUR",               ← optional, Standard: EUR
//   items: [
//     {
//       sku: "STTW079-BLACK-M",    ← Myze SKU (Artikel → SKUs anzeigen)
//       quantity: 2,
//       unitPrice: 24.90
//     }
//   ]
// }

import { getRawBody, mapFormToMyze, placeOrderInMyze } from "./_myze.js";

export default async function handler(req, res) {
  // CORS-Header damit das Shop-Frontend die API aufrufen darf
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // CORS Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    const raw = await getRawBody(req);
    body = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: "Ungültiger Request Body" });
  }

  // Pflichtfelder prüfen
  const required = ["firstName", "lastName", "email", "street", "city", "zip", "items"];
  const missing = required.filter((f) => !body[f]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Fehlende Felder: ${missing.join(", ")}` });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: "Keine Artikel in der Bestellung" });
  }

  // Artikel-Pflichtfelder prüfen
  for (const item of body.items) {
    if (!item.sku || !item.quantity || item.unitPrice == null) {
      return res.status(400).json({ error: "Jeder Artikel braucht sku, quantity und unitPrice" });
    }
  }

  console.log(`[Teamshop] Neue Bestellung von: ${body.email} (${body.items.length} Artikel)`);

  try {
    const myzeOrder = mapFormToMyze(body);
    const result = await placeOrderInMyze(myzeOrder);
    console.log(`[Myze] Draft-Order angelegt: ${result.orderId}`);
    return res.status(200).json({
      success: true,
      orderId: result.orderId,
      externalId: myzeOrder.externalId,
      message: "Bestellung eingegangen. Rechnung folgt separat.",
    });
  } catch (err) {
    console.error("[Fehler] Myze API:", err.message);
    return res.status(500).json({ error: "Bestellung konnte nicht an Myze übermittelt werden." });
  }
}
