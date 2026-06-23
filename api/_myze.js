// api/_myze.js — gemeinsame Hilfsfunktionen für alle Vercel-Funktionen

import crypto from "crypto";

/**
 * Prüft die HMAC-Signatur eines eingehenden Myze-Webhooks.
 */
export function verifyMyzeSignature(rawBody, signature, timestamp) {
  const secret = process.env.MYZE_WEBHOOK_SECRET;
  if (!secret) return true;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("base64");
  return signature === `v1=${expected}`;
}

/**
 * Liest den raw Body aus einem Vercel-Request.
 */
export async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/**
 * Sendet eine Bestellung an die Myze API.
 */
export async function placeOrderInMyze(orderPayload) {
  const url = `${process.env.MYZE_API_URL}/store/${process.env.MYZE_STORE_ID}/place-order`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-accesstoken": process.env.MYZE_ACCESS_TOKEN,
    },
    body: JSON.stringify(orderPayload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Myze API Fehler (${response.status}): ${text}`);
  }
  return response.json();
}

/**
 * Wandelt eine Snipcart-Bestellung ins Myze-Format um.
 * Die Snipcart-Produkt-ID muss die Myze-SKU sein (z.B. "TSHIRT-WHITE-L").
 */
export function mapSnipcartToMyze(order) {
  const { token, items, shippingAddress, finalGrandTotal, paymentMethod, currency, email } = order;

  return {
    externalId: token,
    externalOrderNumber: token.slice(0, 8).toUpperCase(),
    recipient: {
      recipient: shippingAddress.name,
      company: shippingAddress.company || null,
      street: [shippingAddress.address1, shippingAddress.address2].filter(Boolean).join(" "),
      city: shippingAddress.city,
      zip: shippingAddress.postalCode,
      country: shippingAddress.country,
      email: email,
      phone: shippingAddress.phone || null,
      state: shippingAddress.province || null,
    },
    lineItems: items.map((item) => ({
      sku: item.id,
      quantity: item.quantity,
      unitPrice: {
        amount: Math.round(item.unitPrice * 100),
        currency: (currency || "EUR").toUpperCase(),
      },
    })),
    totalPrice: {
      amount: Math.round(finalGrandTotal * 100),
      currency: (currency || "EUR").toUpperCase(),
    },
    paymentMethod: paymentMethod || "Credit Card",
  };
}
