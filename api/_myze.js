// api/_myze.js — gemeinsame Hilfsfunktionen

import crypto from "crypto";

export function verifyMyzeSignature(rawBody, signature, timestamp) {
  const secret = process.env.MYZE_WEBHOOK_SECRET;
  if (!secret) return true;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("base64");
  return signature === `v1=${expected}`;
}

export async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

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

// ── Produktspeicher via Vercel KV ──────────────────────────────────────────
// Vercel KV ist ein einfacher Key-Value Store (kostenlos bis 30MB).
// Produkte werden unter dem Key "products" als JSON-Array gespeichert.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvRequest(method, path, body) {
  const res = await fetch(`${KV_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function getProducts() {
  if (!KV_URL) return [];
  try {
    const result = await kvRequest("GET", "/get/products");
    if (!result.result) return [];
    // Upstash kann doppelt serialisieren — beide Fälle abfangen
    const value = result.result;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return JSON.parse(value);
    return [];
  } catch {
    return [];
  }
}

export async function saveProduct(product) {
  if (!KV_URL) return;
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = product; // Update
  } else {
    products.push(product); // Neu
  }
  await kvRequest("POST", "/set/products", JSON.stringify(products));
}

export function mapMyzeArticleToProduct(data) {
  return {
    id: data.articleId,
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
}
