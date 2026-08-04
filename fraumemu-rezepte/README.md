# Mema – Zuckerarmer Rezeptfinder für fraumemu.de

Popup-Tool: Kundin gibt ein Stichwort ein → Mema durchsucht live das Internet
und liefert 5 Rezepte mit max. 3 g Zucker pro Portion inkl. Nährwerten,
druckbar.

Gehostet auf **Cloudflare Pages** (kostenlos, kein Bandbreitenlimit, 100.000
Funktionsaufrufe/Tag frei).

## Aufbau

- `index.html` – die eigentliche Rezeptsuche (wird als iframe eingebettet)
- `functions/find-recipes.js` – Cloudflare-Pages-Function, die den
  `ANTHROPIC_API_KEY` sicher serverseitig nutzt (niemals im Browser sichtbar)
- `_headers` – erlaubt das Einbetten der Seite als iframe auf fraumemu.de
- `embed-snippet.html` – Code zum Einfügen in Webador (Button + Popup)

## 1. Auf Cloudflare Pages deployen

**Direkt-Upload (ohne GitHub, wie bei Netlify per Drag & Drop):**

1. Gehe auf [dash.cloudflare.com](https://dash.cloudflare.com) und logge dich
   ein (kostenloses Konto reicht).
2. Im Menü links: **Workers & Pages → Create → Pages → Upload assets**.
3. Vergib einen Projektnamen (z. B. `fraumemu-rezepte`) — daraus ergibt sich
   die Adresse `fraumemu-rezepte.pages.dev`.
4. Lade den **kompletten Ordner** `fraumemu-rezepte` hoch (wichtig: der
   Unterordner `functions/` muss mit dabei sein, sonst funktioniert die
   Rezeptsuche nicht).
5. Deploy klicken.

**Alternative – über GitHub (empfohlen für spätere Änderungen):**
1. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
2. Repo `fraumemu/fraumemu-tools` auswählen.
3. Build-Einstellungen: **Framework preset: None**, **Build command: leer
   lassen**, **Build output directory: `fraumemu-rezepte`**.
4. Deploy.

## 2. Umgebungsvariable setzen

Im Cloudflare-Projekt: **Settings → Environment variables → Add variable**

| Variable name | Value | Typ |
|---|---|---|
| `ANTHROPIC_API_KEY` | dein Anthropic API Key (`sk-ant-...`) — findest du unter [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys) | **Encrypt** anklicken (Secret) |

Für die Umgebung **Production** eintragen (bei Bedarf zusätzlich für
**Preview**). Danach: **Deployments → auf die letzte Deployment klicken →
Retry deployment**, damit die Funktion die Variable sieht.

**Kosten-Tipp:** Setze in der [Anthropic Console](https://console.anthropic.com)
unter "Billing" ein monatliches Ausgabenlimit, damit die Kosten (ca.
0,08–0,15 € pro Rezeptsuche) planbar bleiben.

## 3. In Webador einbauen

1. Öffne den Webador-Editor: Seite "Meine Angebote für dich".
2. Füge ein **HTML/Code-Element** an der gewünschten Stelle ein (dort, wo der
   orangene Button erscheinen soll).
3. Öffne `embed-snippet.html` aus diesem Ordner, kopiere den **gesamten
   Inhalt** und füge ihn in das Webador-Element ein.
4. Ersetze im Snippet `DEIN-PROJEKT-NAME` durch den Namen deines
   Cloudflare-Pages-Projekts aus Schritt 1 (z. B. `fraumemu-rezepte`), sodass
   die Zeile lautet:
   ```
   var RECIPE_TOOL_URL = 'https://fraumemu-rezepte.pages.dev/';
   ```
5. Speichern & veröffentlichen.

## 4. Testen

- Öffne die Cloudflare-Pages-Adresse direkt im Browser (z. B.
  `https://fraumemu-rezepte.pages.dev`) und teste die Suche isoliert.
- Öffne danach die live fraumemu.de-Seite, klicke auf den Button und prüfe,
  ob sich das Popup öffnet und Ergebnisse liefert.
- Falls eine Fehlermeldung "Server ist noch nicht vollständig eingerichtet"
  erscheint: `ANTHROPIC_API_KEY` fehlt oder wurde nach dem Setzen nicht neu
  deployed (siehe Schritt 2).

## Hinweis zu Ladezeit

Die Live-Websuche kann 15–30 Sekunden dauern (Mema sucht dabei aktiv mehrere
Quellen durch). Das ist normal und im Popup mit einem Lade-Hinweis
kommuniziert. Sollte es bei sehr langen Suchen zu einem Timeout kommen, kann
die Anzahl der Suchanfragen in `functions/find-recipes.js` (`max_uses`)
reduziert werden.
