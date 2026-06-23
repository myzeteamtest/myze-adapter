# Myze Team-Shop Adapter — Vercel

Verbindet Snipcart (Team-Shop) mit der Myze API (Produktion).
Läuft kostenlos auf Vercel als Serverless Functions.

---

## Einrichten — Schritt für Schritt

### Schritt 1 — Vercel Account anlegen
1. Geh auf https://vercel.com
2. Klick auf „Sign Up"
3. „Continue with GitHub" wählen (GitHub Account anlegen falls nötig — kostenlos)

### Schritt 2 — Projekt hochladen
1. In Vercel Dashboard: „Add New Project" klicken
2. „Upload" wählen (oder via GitHub Repository)
3. Den Inhalt dieser ZIP-Datei hochladen

### Schritt 3 — Umgebungsvariablen eintragen
Im Vercel Projekt unter **Settings → Environment Variables** folgende Werte eintragen:

| Name | Wert | Wo finden |
|---|---|---|
| `MYZE_API_URL` | `https://api.myze.brother.digital/company/EURE_ID` | Von Myze Support erfragen |
| `MYZE_ACCESS_TOKEN` | euer Token | Myze → Custom Store → Access Token |
| `MYZE_STORE_ID` | eure Store ID | Myze → Custom Store → Store ID |
| `MYZE_WEBHOOK_SECRET` | euer Secret | Myze → Custom Store → Webhook Secret |
| `SNIPCART_SECRET_KEY` | euer Key | Snipcart → Account → API Keys |

### Schritt 4 — Webhook URLs in Snipcart eintragen
Snipcart Dashboard → Account → Webhooks:
```
https://EUER-PROJEKTNAME.vercel.app/api/webhook/snipcart
```

### Schritt 5 — Webhook URLs in Myze eintragen
Myze → Custom Store Connector:
```
Webhook URL:        https://EUER-PROJEKTNAME.vercel.app/api/webhook/myze
Article Published:  https://EUER-PROJEKTNAME.vercel.app/api/webhook/article-published
```

### Schritt 6 — Testen
```
https://EUER-PROJEKTNAME.vercel.app/api/health
→ {"status":"ok","service":"myze-teamshop-adapter"}
```

---

## Dateistruktur

```
myze-adapter-vercel/
├── api/
│   ├── _myze.js                    ← Gemeinsame Hilfsfunktionen
│   ├── health.js                   ← GET  /api/health
│   └── webhook/
│       ├── snipcart.js             ← POST /api/webhook/snipcart
│       ├── myze.js                 ← POST /api/webhook/myze
│       └── article-published.js    ← POST /api/webhook/article-published
├── vercel.json                     ← Vercel Konfiguration
├── package.json
├── .env.example                    ← Vorlage (nicht hochladen!)
└── README.md
```

---

## Ablauf einer Bestellung

```
1. Kunde kauft im Snipcart Shop
2. Snipcart → POST /api/webhook/snipcart
3. Adapter wandelt Bestellung um
4. Adapter → Myze API (POST /place-order)
5. Myze produziert + versendet
6. Myze → POST /api/webhook/myze (shipped)
```

---

## Wichtig: Produkt-SKUs

Die **Snipcart-Produkt-ID** muss die **Myze-SKU** sein.
SKUs in Myze findest du unter: Artikel → Menü → „SKUs anzeigen"

Beispiel Snipcart Produkt-Button:
```html
<button
  class="snipcart-add-item"
  data-item-id="TSHIRT-WHITE-L"
  data-item-price="29.99"
  data-item-name="FC Musterstadt T-Shirt Weiß L"
  data-item-image="https://..."
>
  In den Warenkorb
</button>
```
