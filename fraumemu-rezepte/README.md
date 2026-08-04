# Mema – Zuckerarmer Rezeptfinder für fraumemu.de

Popup-Tool: Kundin gibt ein Stichwort ein → Mema durchsucht live das Internet
und liefert 5 Rezepte mit max. 3 g Zucker pro Portion inkl. Nährwerten,
druckbar.

## Aufbau

- `index.html` – die eigentliche Rezeptsuche (wird als iframe eingebettet)
- `netlify/functions/find-recipes.mjs` – Server-Funktion, die den
  `ANTHROPIC_API_KEY` sicher serverseitig nutzt (niemals im Browser sichtbar)
- `netlify.toml` – Netlify-Konfiguration
- `embed-snippet.html` – Code zum Einfügen in Webador (Button + Popup)

## 1. Auf Netlify deployen

**Option A – Drag & Drop (am schnellsten, ohne GitHub):**
1. Gehe auf [app.netlify.com](https://app.netlify.com) und logge dich ein.
2. Auf der Startseite: Ziehe den kompletten Ordner `fraumemu-rezepte`
   in das Feld "Drag and drop your site output folder here".
3. Netlify vergibt automatisch eine Adresse wie
   `zufälliger-name-12345.netlify.app`. Du kannst den Namen unter
   **Site settings → Change site name** anpassen, z. B. auf
   `fraumemu-rezepte.netlify.app`.

**Option B – über GitHub (empfohlen für spätere Änderungen):**
1. Dieses Repo (`fraumemu-tools`) ist bereits mit GitHub verbunden.
2. In Netlify: **Add new site → Import an existing project → GitHub** →
   Repo `fraumemu/fraumemu-tools` auswählen.
3. Base directory: `fraumemu-rezepte`
   Publish directory: `fraumemu-rezepte`
   Functions directory: `fraumemu-rezepte/netlify/functions`
4. Deploy.

## 2. Umgebungsvariable setzen

In Netlify: **Site settings → Environment variables → Add a variable**

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | dein Anthropic API Key (`sk-ant-...`) — findest du unter [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys) |

Danach: **Deploys → Trigger deploy → Clear cache and deploy site**, damit die
Funktion die Variable sieht.

**Kosten-Tipp:** Setze in der [Anthropic Console](https://console.anthropic.com)
unter "Billing" ein monatliches Ausgabenlimit, damit die Kosten (ca.
0,08–0,15 € pro Rezeptsuche) planbar bleiben.

## 3. In Webador einbauen

1. Öffne den Webador-Editor: Seite "Meine Angebote für dich".
2. Füge ein **HTML/Code-Element** an der gewünschten Stelle ein (dort, wo der
   orangene Button erscheinen soll).
3. Öffne `embed-snippet.html` aus diesem Ordner, kopiere den **gesamten
   Inhalt** und füge ihn in das Webador-Element ein.
4. Ersetze im Snippet `DEIN-NETLIFY-NAME` durch den Namen deiner Netlify-Seite
   aus Schritt 1 (z. B. `fraumemu-rezepte`), sodass die Zeile lautet:
   ```
   var NETLIFY_URL = 'https://fraumemu-rezepte.netlify.app/';
   ```
5. Speichern & veröffentlichen.

## 4. Testen

- Öffne die Netlify-Adresse direkt im Browser (z. B.
  `https://fraumemu-rezepte.netlify.app`) und teste die Suche isoliert.
- Öffne danach die live fraumemu.de-Seite, klicke auf den Button und prüfe,
  ob sich das Popup öffnet und Ergebnisse liefert.
- Falls eine Fehlermeldung "Server ist noch nicht vollständig eingerichtet"
  erscheint: `ANTHROPIC_API_KEY` fehlt oder wurde nach dem Setzen nicht neu
  deployed (siehe Schritt 2).

## Hinweis zu Ladezeit

Die Live-Websuche kann 15–30 Sekunden dauern (Mema sucht dabei aktiv mehrere
Quellen durch). Das ist normal und im Popup mit einem Lade-Hinweis
kommuniziert. Sollte die Netlify-Funktion bei sehr langen Suchen ein Timeout
melden, kann die Anzahl der Suchanfragen in
`netlify/functions/find-recipes.mjs` (`max_uses`) reduziert werden.
