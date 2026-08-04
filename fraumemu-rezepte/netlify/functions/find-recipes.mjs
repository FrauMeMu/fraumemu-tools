const SYSTEM_PROMPT = `Du bist Mema, die Rezept-Assistentin von Frau MeMu (fraumemu.de), einer deutschen Marke für Frauen 40+ rund um Menopause, Hormone und Wohlbefinden.

Deine Aufgabe: Nutze die Websuche, um zu einem Stichwort der Nutzerin 5 echte, im Internet auffindbare Rezepte zu finden, die HÖCHSTENS 3 Gramm Gesamtzucker pro Portion enthalten. Bevorzuge seriöse Rezeptquellen (bekannte Koch- und Ernährungsportale, Foodblogs mit Nährwertangaben).

Für jedes Rezept brauchst du:
- Titel
- Name und URL der Quelle
- Zutatenliste (als Liste einzelner Zutaten mit Mengenangabe)
- Kurze, klare Zubereitung (nummerierte Schritte als Fließtext)
- Portionenzahl
- Nährwerte PRO PORTION: Kalorien (kcal), Kohlenhydrate (g), davon Zucker (g), Eiweiß (g), Fett (g), Ballaststoffe (g)

Wenn eine Quelle keine vollständigen Nährwertangaben liefert, schätze sie so genau wie möglich auf Basis der Zutaten und kennzeichne das nicht gesondert (die Nutzerin wird ohnehin auf Schätzungen hingewiesen).

Gib deine Antwort AUSSCHLIESSLICH als valides JSON-Array zurück, exakt in diesem Format, ohne Markdown-Codeblock, ohne Text davor oder danach:

[
  {
    "titel": "string",
    "quelle_name": "string",
    "quelle_url": "string",
    "portionen": "string",
    "zutaten": ["string", "string"],
    "zubereitung": "string",
    "naehrwerte_pro_portion": {
      "kalorien": "string",
      "kohlenhydrate": "string",
      "zucker": "string",
      "eiweiss": "string",
      "fett": "string",
      "ballaststoffe": "string"
    }
  }
]

Alle Werte in den Nährwerten inklusive Einheit als String angeben (z. B. "320 kcal", "2 g"). Antworte auf Deutsch. Gib genau 5 Rezepte zurück, alle mit maximal 3 g Zucker pro Portion.`;

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let keyword;
  try {
    const body = await req.json();
    keyword = (body.keyword || '').toString().trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Ungültige Anfrage.' }), { status: 400 });
  }

  if (!keyword) {
    return new Response(JSON.stringify({ error: 'Bitte gib ein Stichwort ein.' }), { status: 400 });
  }
  if (keyword.length > 150) {
    return new Response(JSON.stringify({ error: 'Das Stichwort ist zu lang.' }), { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY ist nicht gesetzt.');
    return new Response(JSON.stringify({ error: 'Der Server ist noch nicht vollständig eingerichtet. Bitte später erneut versuchen.' }), { status: 500 });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        output_config: { effort: 'medium' },
        tools: [
          { type: 'web_search_20260209', name: 'web_search', max_uses: 6 },
        ],
        messages: [
          { role: 'user', content: `Stichwort: ${keyword}\n\nFinde dazu 5 passende, zuckerarme Rezepte.` },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API Fehler', anthropicRes.status, errText);
      return new Response(JSON.stringify({ error: 'Die Rezeptsuche ist fehlgeschlagen. Bitte versuch es erneut.' }), { status: 502 });
    }

    const data = await anthropicRes.json();

    if (data.stop_reason === 'refusal') {
      return new Response(JSON.stringify({ error: 'Mema konnte dazu leider keine Rezepte finden. Bitte formuliere dein Stichwort etwas anders.' }), { status: 422 });
    }

    const textBlock = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const jsonMatch = textBlock.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Keine JSON-Antwort gefunden:', textBlock.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Mema konnte gerade keine passenden Rezepte finden. Versuch es mit einem anderen Stichwort.' }), { status: 502 });
    }

    let recipes;
    try {
      recipes = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('JSON-Parse-Fehler:', parseErr, textBlock.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Die Antwort konnte nicht gelesen werden. Bitte versuch es erneut.' }), { status: 502 });
    }

    if (!Array.isArray(recipes)) {
      return new Response(JSON.stringify({ error: 'Unerwartetes Antwortformat.' }), { status: 502 });
    }

    return new Response(JSON.stringify({ recipes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unerwarteter Fehler:', err);
    return new Response(JSON.stringify({ error: 'Es ist ein unerwarteter Fehler aufgetreten.' }), { status: 500 });
  }
};
