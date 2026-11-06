# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Besucher einer Page** (Hauptpublikum): gemischt. Überwiegend Freundeskreis und Szene (Kollektiv-Mitglieder, befreundete Crews, Nachbarn), die den Link per Messenger bekommen und meist am Handy öffnen. Einzelne Pages, vor allem die des Kollektivs, sind auch für Externe gedacht, die Equipment leihen wollen und die Verleiher nicht unbedingt kennen. Job: schnell sehen, was es gibt, ob es gerade frei ist, und dann Kontakt aufnehmen.
- **Admin** (genau eine Person, Stani): legt Pages an, wählt Lagerorte und sichtbare Infos, trägt Verleihe ein und beendet sie.
- **Freunde mit eigenem Inventar** pflegen ihre Sachen in Homebox (gleiche Gruppe), nicht in dieser App.

## Product Purpose

Homebox Front ist das öffentliche Schaufenster für ein privates Homebox-Inventar. Man schickt jemandem einen Link zu einer Page und sieht wie in einem Online-Shop, was es zum Ausleihen gibt und ob es gerade verfügbar oder verliehen ist. Ziel: Leute helfen sich gegenseitig mit Maschinen und Werkzeug aus, das Kollektiv zeigt, welches Party-Equipment es verleiht.

Erfolg heißt: Besucher finden in Sekunden, was sie suchen, sehen ehrlich, ob es frei ist und bis wann nicht, und wissen, wen sie fragen müssen.

## Positioning

Kein eigenes Inventarsystem, sondern ein Fenster auf Homebox: Homebox bleibt die einzige Datenquelle, auch für den Verleih-Status. Die App liest per API-Key und schreibt ausschließlich das Custom Field `Verleih`. Eine Page bündelt einen oder mehrere Homebox-Lagerorte (inkl. Unterorte und Items in Items) und gibt pro Page frei, welche Infos sichtbar sind.

## Operating Context

- Links werden per Messenger geteilt und überwiegend am Handy geöffnet; Desktop muss sauber funktionieren.
- Pages können per Passwort geschützt sein; Pages sind nur per Link auffindbar, die Startseite listet nichts.
- Verleih-Format im Homebox-Feld `Verleih`: `6× bis 2026-11-14 (Max); 2× bis 2026-12-01`. Ein Verleih gilt bis einschließlich des Datums (Europe/Berlin), danach automatisch wieder verfügbar. Teilmengen sind möglich.
- Stani bearbeitet parallel in der Homebox-UI; Beschreibungen in Homebox sind Markdown.
- Betrieb vorerst lokal; später evtl. Coolify (nichts einbauen, was Docker verhindert).

## Capabilities and Constraints

- Pages mit eigenem Slug, Layout A (Klassischer Shop), B (Schaufenster) oder C (Kompakte Liste), optional Passwort, Kontaktfeld, Einleitung, Logo und Akzentfarbe.
- Pro Page wählbar: Beschreibung, Hersteller, Modell, Menge, Kaufpreis, Notizen, Asset-ID, Tags, Lagerort, Custom Fields sowie Anhang-Arten (Anleitungen, sonstige Anhänge, Garantie, Rechnungen). Name, Bild und Verfügbarkeit sind immer sichtbar.
- Suche, Filter nach Lagerort und „Nur verfügbare“, Paginierung (24 pro Schritt), Detailseite mit Galerie.
- Items mit Tag `privat` (änderbar) erscheinen nirgends; archivierte Items ebenso.
- Harte Grenzen: Der Homebox-API-Key verlässt nie den Server. An wen etwas verliehen ist, ist öffentlich nie sichtbar. Bilder und Anhänge nur über den eigenen Proxy und nur, wenn sie zur freigegebenen Page gehören. Ein Schreibvorgang darf keine anderen Homebox-Felder verändern.
- Kein Warenkorb, keine Online-Reservierung, keine Inventarpflege in der App, keine Mehrbenutzer-Administration.

## Brand Commitments

- Name: **Homebox Front**.
- Logo: die Homebox-Box („lilbox“) mit Laden-Markise, Schaufenster und Tür (`public/logo.svg`, Generator `docs/logo-generator.py`). Bewusst als Ableitung des Homebox-Logos gewählt.
- Sprache Deutsch. Tonfall locker, per du, kurze Sätze, wie unter Freunden („Frag einfach!“).
- Jede Page kann eigenes Logo und eigene Akzentfarbe haben; die App selbst tritt dahinter zurück.

## Evidence on Hand

- Echtes Inventar liegt in Homebox (Adresse in `HOMEBOX_URL`); lokal ohne Token läuft ein Mock-Modus mit Beispieldaten (`HOMEBOX_MOCK=1`).
- Keine Testimonials, Nutzerzahlen oder Fotos von Verleih-Situationen vorhanden; nichts davon erfinden.

## Product Principles

1. **Homebox ist die Wahrheit.** Was dort steht, zeigt die App; was die App schreibt, muss dort sichtbar und von Hand änderbar bleiben.
2. **Verfügbarkeit zuerst.** Ob etwas frei ist und ab wann wieder, ist die wichtigste Information auf jeder Ansicht.
3. **Teilen ohne Bloßstellen.** Nur zeigen, was für die Page freigegeben ist; Empfänger, Belege und private Sachen bleiben verborgen.
4. **Ein Link reicht.** Kein Konto, keine Anmeldung für Besucher; höchstens ein Page-Passwort.
5. **Die Page gehört dem, der verleiht.** Logo, Farbe und Ton der Page stehen vorne, die App bleibt im Hintergrund.

## Accessibility & Inclusion

Ziel ist WCAG 2.2 AA (Kontrast, Tastaturbedienung, Fokus, verständliche Beschriftungen). Darüber hinaus keine besondere Anforderung festgelegt.
