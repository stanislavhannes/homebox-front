# Homebox Front

Öffentliches Schaufenster für das Homebox-Inventar: Pages mit eigenem Link zeigen einen oder
mehrere Lagerorte wie einen Online-Shop, inkl. Verfügbarkeit („verliehen bis …“). Homebox bleibt
die Datenquelle; die App liest per API-Key und schreibt nur das Custom Field `Verleih`.

Design: [`docs/superpowers/specs/2026-11-06-homebox-front-design.md`](docs/superpowers/specs/2026-11-06-homebox-front-design.md)

## Starten

```bash
cp .env.example .env.local   # ausfüllen (Token, Admin-Passwort, SESSION_SECRET)
npm install
npm run dev                  # http://localhost:3000, Verwaltung unter /admin
```

Ohne Homebox-Token ausprobieren: `HOMEBOX_MOCK=1` in `.env.local`. Dann gibt es Beispieldaten
(Kollektiv-Lager, Garage …); Verleihe landen nur im Speicher.

Produktion lokal: `npm run build && npm run start`. Node ≥ 22.5 (nutzt `node:sqlite`).

## Wie es funktioniert

| Was | Wo |
|---|---|
| Pages, Passwörter, Feldauswahl, Logo, Farbe, versteckter Tag | SQLite `data/app.db` (App-eigen) |
| Items, Bilder, Anleitungen, Verleih | Homebox |
| Verleih-Format | Custom Field `Verleih` am Item: `6× bis 2026-11-14 (Max); 2× bis 2026-12-01` |

- **Verfügbarkeit** = Anzahl minus aktive Verleihe. Ein Verleih „bis 14.11.“ gilt am 14.11. noch,
  ab 15.11. ist das Teil wieder verfügbar (Zeitzone Europe/Berlin). Empfänger sieht nur der Admin.
- **Verleih eintragen**: `/admin/loans` → „Verleihen“. Die App liest das Item frisch, ändert nur
  `Verleih`, schickt den kompletten PUT (Homebox löscht sonst fehlende Felder) und vergleicht
  danach, ob sich etwas anderes verändert hat. Das Feld kann auch direkt in Homebox bearbeitet
  werden; unlesbare Einträge bleiben erhalten und werden im Admin markiert.
- **Sichtbarkeit**: Alles unter den gewählten Lagerorten (inkl. Unterorte und Items in Items),
  außer archivierte Items und Items mit dem versteckten Tag (Standard `privat`, unter
  Einstellungen änderbar) samt deren Inhalt.
- **Pro Page**: Layout A (Klassischer Shop), B (Schaufenster) oder C (Kompakte Liste), optionales Logo
  (PNG/JPG/WebP/GIF/SVG, max. 2 MB, erscheint auch auf der Passwortseite) und eine Akzentfarbe
  (Vorschläge oder frei wählbar). Es werden 24 Teile auf einmal gezeigt, danach „Weitere anzeigen“.
- **Cache**: Homebox-Daten 60 s; nach Verleih-Aktionen sofort aktuell. Änderungen direkt in Homebox
  erscheinen nach spätestens einer Minute, oder sofort über „Aus Homebox neu laden“ im Admin.
- **Sicherheit**: Der API-Key bleibt auf dem Server. Bilder/Anleitungen laufen über
  `/api/img/<page>/<item>/<anhang>`, der prüft, dass das Item auf der Page liegt und die Page
  freigeschaltet ist.

## Tests

```bash
npm test          # Verleih-Parser, Verfügbarkeit, PUT-Body (vitest)
```

Ein Browser-Durchlauf (Login, Pages, Passwort, Suche/Filter, Proxy-Schutz, Verleih, Mobile)
wurde gegen den Mock-Modus gefahren; gegen die echte Homebox steht der Test noch aus (siehe
„Vor dem ersten echten Einsatz“).

## Vor dem ersten echten Einsatz

1. API-Key in Homebox anlegen und als `HOMEBOX_TOKEN` in `.env.local` eintragen, `HOMEBOX_MOCK=0`.
2. Einmal an einem **Test-Item** verleihen und zurückgeben und in Homebox prüfen, dass Name,
   Notizen, Tags, Bilder und andere Felder unverändert sind. Die App bricht mit einer Meldung ab,
   falls der Abgleich nach dem Speichern Unterschiede findet.
