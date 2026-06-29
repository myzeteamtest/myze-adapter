# Myze Teamshop Adapter — Vercel

Verbindet den öffentlichen Teamshop mit der Myze API.
Läuft kostenlos auf Vercel als Serverless Functions.
Keine Zahlung im Shop — Rechnung wird manuell über die Buchhaltung gestellt.

---

## Ablauf einer Bestellung

```
1. Kunde wählt Artikel + Größen im Teamshop
2. Kunde gibt Kontaktdaten + Lieferadresse ein
3. Klick auf "Bestellung absenden"
4. Teamshop → POST /api/order
5. Adapter → Myze API (POST /place-order, paymentMethod: Invoice)
6. Order landet als Draft in Myze
7. Buchhaltung stellt Rechnung manuell aus
8. Myze → POST /api/webhook/myze (shipped) wenn versendet
```

---

## Einrichten — Schritt für Schritt

### Schritt 1 — Vercel Account anlegen
1. Geh auf https://vercel.com
2. Klick auf „Sign Up"
3. „Continue with GitHub" wählen

### Schritt 2 — Projekt hochladen
1. In Vercel Dashboard: „Add New Project" klicken
2. „Upload" wählen (oder via GitHub Repository)
3. Den Inhalt dieser ZIP-Datei hochladen

### Schritt 3 — Umgebungsvariablen eintragen
Im Vercel Projekt unter **Settings → Environment Variables**:

| Name | Wert | Wo finden |
|---|---|---|
| `MYZE_API_URL` | `https://api.myze.brother.digital/company/EURE_ID` | Myze Support |
| `MYZE_ACCESS_TOKEN` | euer Token | Myze → Custom Store → Access Token |
| `MYZE_STORE_ID` | eure Store ID | Myze → Custom Store → Store ID |
| `MYZE_WEBHOOK_SECRET` | euer Secret | Myze → Custom Store → Webhook Secret |
| `KV_REST_API_URL` | Upstash URL | Upstash Dashboard |
| `KV_REST_API_TOKEN` | Upstash Token | Upstash Dashboard |

### Schritt 4 — Webhook URLs in Myze eintragen
Myze → Custom Store Connector:
```
Webhook URL:        https://EUER-PROJEKTNAME.vercel.app/api/webhook/myze
Article Published:  https://EUER-PROJEKTNAME.vercel.app/api/webhook/article-published
```

### Schritt 5 — Testen
```
GET https://EUER-PROJEKTNAME.vercel.app/api/health
→ {"status":"ok","service":"myze-teamshop-adapter"}

GET https://EUER-PROJEKTNAME.vercel.app/api/products
→ [] (leer bis erster Artikel in Myze publiziert wird)
```

---

## Dateistruktur

```
myze-adapter-vercel/
├── api/
│   ├── _myze.js                    ← Gemeinsame Hilfsfunktionen
│   ├── health.js                   ← GET  /api/health
│   ├── products.js                 ← GET  /api/products
│   ├── order.js                    ← POST /api/order (Bestellung aus Shop)
│   └── webhook/
│       ├── myze.js                 ← POST /api/webhook/myze
│       └── article-published.js    ← POST /api/webhook/article-published
├── vercel.json
├── package.json
└── README.md
```

---

## API — Bestellung absenden

**POST /api/order**

```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "email": "max@example.de",
  "phone": "+49 211 123456",
  "street": "Sportplatzweg 4",
  "city": "Düsseldorf",
  "zip": "40210",
  "country": "DE",
  "currency": "EUR",
  "items": [
    {
      "sku": "STTW079-BLACK-M",
      "quantity": 2,
      "unitPrice": 24.90
    }
  ]
}
```

**Response (Erfolg):**
```json
{
  "success": true,
  "orderId": "myze-order-id",
  "externalId": "SHOP-1234567890",
  "message": "Bestellung eingegangen. Rechnung folgt separat."
}
```

---

## Wichtig: Produkt-SKUs

Die SKUs im Shop müssen den Myze-SKUs entsprechen.
SKUs in Myze findest du unter: Artikel → Menü → „SKUs anzeigen"

Beispiel: `STTW079-BLACK-M` = Stanley Stella Expresser 2.0, Schwarz, Größe M
