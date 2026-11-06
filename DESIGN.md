---
name: Homebox Front
description: Das Schaufenster vor dem Homebox-Lager – ausleihen unter Freunden.
colors:
  ink: "oklch(0.145 0 0)"
  ink-soft: "oklch(0.205 0 0)"
  paper: "oklch(1 0 0)"
  shelf-grey: "oklch(0.97 0 0)"
  pencil-grey: "oklch(0.556 0 0)"
  hairline: "oklch(0.922 0 0)"
  ring-grey: "oklch(0.708 0 0)"
  alarm-red: "oklch(0.577 0.245 27.325)"
  awning-orange: "#ea7a35"
  awning-orange-deep: "#b84f16"
  awning-text: "#a9480f"
  homebox-green: "#567f67"
  homebox-green-text: "#4a7059"
  box-grey: "#dadada"
  status-free-bg: "#d0fae5"
  status-free-text: "#006045"
  status-free-dot: "#00bc7d"
  status-partial-bg: "#fef3c6"
  status-partial-text: "#7b3306"
  status-partial-dot: "#fe9a00"
  status-lent-bg: "#ffe4e6"
  status-lent-text: "#a50036"
  status-lent-dot: "#ff2056"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.025em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink-soft}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  chip-filter:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "32px"
  chip-filter-active:
    backgroundColor: "{colors.ink-soft}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 36px"
    height: "40px"
  card-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px"
  badge-available:
    backgroundColor: "{colors.status-free-bg}"
    textColor: "{colors.status-free-text}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-partial:
    backgroundColor: "{colors.status-partial-bg}"
    textColor: "{colors.status-partial-text}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-lent:
    backgroundColor: "{colors.status-lent-bg}"
    textColor: "{colors.status-lent-text}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: Homebox Front

## Overview

**Creative North Star: "Der Tisch unter Freunden"**

Homebox Front ist der Flohmarkt-Tisch, den man Freunden hinstellt: Alles liegt offen da, jedes Teil hat ein Schild, ob es gerade da ist, und wer etwas will, fragt einfach. Die Oberfläche ist hell, ordentlich und unaufgeregt wie ein aufgeräumter Tisch, aber nicht anonym. Persönlichkeit kommt vom Verleiher (Logo, Akzentfarbe und Ton seiner Page) und aus kleinen, warmen Details der App selbst: der Markise im Logo, der lockeren Sprache, den runden Status-Schildchen.

Die Dichte ist mittel: Kacheln mit großem Foto, darunter Name, Hersteller und ein Status-Badge. Der Status ist auf jeder Ansicht das zweitwichtigste Element nach dem Bild. Die Seiten sind für das Handy gebaut (Links kommen per Messenger) und skalieren auf Desktop zu Raster mit Seitenleiste (Layout A), Schaufenster mit Header (B) oder kompakter Liste (C).

Die App läuft in Hell und Dunkel nach Systemeinstellung. Das Grundgerüst ist neutral (Tinte auf Papier), damit jede Page ihre eigene Farbe tragen kann. Im Admin dürfen Markisen-Orange und Homebox-Grün aus dem Logo als eigene Note auftreten.

**Key Characteristics:**
- Neutrales Papier-und-Tinte-Gerüst, eine Akzentfarbe pro Page
- Verfügbarkeit als farbiges Schildchen mit Punkt: Grün, Bernstein, Rosé
- Flach mit feinen Rahmen; Tiefe nur als Hauch und als Reaktion auf Hover
- Weiche, freundliche Rundungen, Chips und Badges als Pillen
- Mobil zuerst, Inhalte (Fotos, Namen) vor Interface

## Colors

Neutrale Graustufen ohne Farbstich als Bühne, drei feste Statusfarben und eine frei wählbare Akzentfarbe pro Page.

### Primary
- **Tinte** (`ink-soft`, oklch(0.205 0 0)): Standard-Akzent, wenn eine Page keine eigene Farbe hat. Primär-Buttons, aktive Filter-Chips, Checkboxen. Im Dunkelmodus kehrt sie sich zu hellem Grau (oklch(0.922 0 0)) um.
- **Page-Akzent** (variabel, `--primary`): Ersetzt die Tinte innerhalb einer Page. Vorschläge Blau #2563eb, Indigo #4f46e5, Violett #7c3aed, Magenta #c026d3, Petrol #0891b2, Orange #ea580c, Schiefer #475569 oder frei gewählt. Farbtöne im Rot- (340–15°) oder Grün-Bereich (105–170°) verschiebt die App an den Rand der Zone, weil sie Status vortäuschen würden. Der Admin erklärt das unter der Farbwahl. Die Schrift darauf ist automatisch Weiß oder Fast-Schwarz, je nachdem, was mehr Kontrast hat. Die App leitet zwei Varianten ab: hell (gegen Weiß) und dunkel (gegen die dunkle Karte #171717). Reicht die gewählte Farbe nicht für 4.5:1, wird sie abgedunkelt bzw. aufgehellt (`lib/theme.ts`, Klasse `accent-custom`). Im Schaufenster-Layout färbt der Akzent den dunklen Header ein (40 % Akzent in fast Schwarz).

### Secondary
Nur im Admin-Bereich (Klasse `admin-theme`) und im Logo. Auf öffentlichen Pages nie.
- **Markisen-Orange** (#ea7a35): Logo-Farbe. Im Dunkelmodus ist es der Admin-Akzent (`--primary`) mit Fast-Schwarz darauf (6.9:1).
- **Markise tief** (#b84f16): Admin-Akzent im Hellmodus für Primär-Buttons, Checkboxen und Fokus, mit Weiß darauf (5.0:1). Das Original-Orange erreicht mit Weiß nur 2.9:1.
- **Markisen-Schrift** (#a9480f): Schrift des aktiven Navigations-Tabs auf 12 % Orange-Tönung (5.2:1). Im Dunkelmodus #f0955a auf 18 % Tönung.
- **Homebox-Grün** (#567f67): Fensterfarbe im Logo. Als Schrift für Erfolgsmeldungen im Admin („Gespeichert.“) die tiefere Stufe #4a7059 (5.6:1), im Dunkelmodus #8fb59f. Es ist bewusst nicht das Ampel-Grün.

### Neutral
- **Papier** (oklch(1 0 0)): Seiten- und Kartenhintergrund.
- **Tinte tief** (oklch(0.145 0 0)): Fließtext und Überschriften.
- **Regalgrau** (oklch(0.97 0 0)): gedämpfte Flächen wie Bild-Platzhalter, Hover, Kontaktkasten (40 % deckend) und Tabellenköpfe.
- **Bleistiftgrau** (oklch(0.556 0 0)): Nebeninfos wie Hersteller, Lagerort, Zähler und Hinweise.
- **Haarlinie** (oklch(0.922 0 0)): Rahmen von Karten, Inputs, Listen und Trennlinien.
- **Kistengrau** (#dadada): nur im Logo.

### Status (fest, nie durch den Page-Akzent ersetzt)
- **Verfügbar**: Mintgrund #d0fae5, Text #006045, Punkt #00bc7d.
- **Teilweise da** („2 von 10 verfügbar“): Bernsteingrund #fef3c6, Text #7b3306, Punkt #fe9a00.
- **Verliehen bis …**: Roségrund #ffe4e6, Text #a50036, Punkt #ff2056.
- Im Dunkelmodus liegen sie als 15 % deckende Tönung mit heller Schrift (300er-Stufe) vor.

**The Ampel Rule.** Grün, Bernstein und Rosé bedeuten ausschließlich Verfügbarkeit. Keine andere Information, kein Akzent und keine Deko darf diese drei Farben tragen, auch nicht der Page-Akzent.

**The Ausnahmen-Rule.** Auf Karten und Listenzeilen erscheinen nur Ausnahmen („Verliehen bis …“, „2 von 10 verfügbar“). „Verfügbar“ ist der Normalfall und steht dort nur für Screenreader. Auf der Detailseite steht der Status immer.

**The One Accent Rule.** Pro Page gibt es genau eine Akzentfarbe. Sie färbt Interaktion (Buttons, aktive Chips, Links, Fokus), nie Flächen oder Text in großer Menge.

## Typography

**Display Font:** Geist (mit ui-sans-serif, system-ui)
**Body Font:** Geist
**Label/Mono Font:** Geist Mono, nur für Slugs im Admin

**Character:** Eine einzige, sachlich-freundliche Grotesk in fetten, eng laufenden Überschriften und ruhigem Fließtext. Hierarchie entsteht über Gewicht und Größe, nicht über eine zweite Schrift.

### Hierarchy
- **Display** (700, 2.25rem ab sm, sonst 1.875rem, Laufweite −0.025em): Page-Titel im Schaufenster-Header (B).
- **Headline** (700, 1.875rem, −0.025em): Item-Name auf der Detailseite (mobil 1.5rem), Admin-Seitentitel (1.5rem).
- **Title** (700, 1.125rem): Page-Titel in den Sticky-Headern von A und C.
- **Body** (400, 0.875rem, 1.5): Standardtext. Beschreibungen auf der Detailseite in 1rem mit lockerer Zeilenhöhe; Einleitung höchstens ca. 65 Zeichen breit (max-w-2xl/3xl).
- **Item-Name in Kacheln** (600, 0.875rem, höchstens 2 Zeilen, `text-pretty`).
- **Label** (600, 0.75rem, Großbuchstaben, Laufweite +0.025em): Abschnittsköpfe der Seitenleiste („LAGERORTE“, „STATUS“). Badges in 500, 0.75rem, ohne Großschreibung.

**The Zahlen-ruhig Rule.** Zähler und Mengen stehen in `tabular-nums`, damit Listen beim Filtern nicht springen.

## Layout

Mobil zuerst, mit 16px Seitenrand (px-4). Inhaltsbreiten: Layout A max. 1280px mit 224px Seitenleiste ab md, Layout B und Detailseite max. 1152px, Layout C max. 896px.

- **Kachelraster:** 2 Spalten mobil, 3 ab sm, 4 ab lg. Abstand 12px, ab lg 16px. 24 Kacheln pro Schritt (teilbar durch 2/3/4), danach „Weitere anzeigen“.
- **Filter:** Auf Desktop in A als Seitenleiste mit eingerückten Unterorten (0.75rem pro Ebene). Mobil und in B/C als horizontal scrollende Chip-Reihe ohne sichtbaren Scrollbalken, die bis an den Bildschirmrand läuft (-mx-4 px-4).
- **Header:** A und C kleben oben (sticky) mit 85 % deckendem, weichgezeichnetem Hintergrund. B hat einen großen dunklen Header (40–56px vertikales Padding).
- **Detailseite:** zweispaltig ab md (Galerie | Infos), 32–40px Abstand. Mobil untereinander.
- **Abstandsrhythmus:** 4/8/12/16/24/32px. Abschnitte im Admin-Formular als Zwei-Spalten-Raster (14rem Beschriftung | Inhalt) mit Trennlinien.

## Elevation & Depth

Flach mit Rahmen. Flächen werden durch 1px-Haarlinien und Tonwerte getrennt, nicht durch Schatten. Schatten gibt es nur als Hauch in Ruhe und als Antwort auf Interaktion.

### Shadow Vocabulary
- **Hauch** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Kacheln in Ruhe, Badges auf Fotos, Login- und Passwortkarte (`shadow-sm`).
- **Anheben** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) plus `translateY(-2px)`: Kachel bei Hover.
- **Milchglas** (`backdrop-filter: blur(8px)` mit 70–85 % Hintergrund): nur Sticky-Header.

**The Flat-At-Rest Rule.** Nichts schwebt, solange man es nicht berührt. Ein Schatten über `shadow-sm` in Ruhe ist ein Fehler.

## Shapes

Freundlich gerundet, nie spitz und nie blasig. Grundradius 10px (`--radius: 0.625rem`), daraus abgeleitet 6/8/10/14/18px. Kacheln, Listen, Galerie und Kontaktkästen haben 14px, Buttons und Inputs 10px, Detail-Galerie und Login-Karte 18px. Chips, Status-Badges und Farbmuster sind Pillen (voll gerundet). Fotos werden im Seitenverhältnis 4:3 beschnitten (`object-cover`), Listen-Thumbnails quadratisch mit 10px Radius. Logos werden nie beschnitten (`object-contain`).

## Components

### Buttons
Klein, ruhig und präzise; sie dienen, statt zu werben.
- **Shape:** sanft gerundet (10px), Höhe 32px, Schrift 14px/500.
- **Primary:** Akzentfarbe (Tinte oder Page-Akzent) mit kontrastierender Schrift. Hover auf 80 % Deckkraft.
- **Outline:** Papier mit Haarlinie, Hover in Regalgrau. Standard für sekundäre Aktionen wie „Weitere anzeigen“ oder „Filter zurücksetzen“.
- **Ghost:** ohne Rahmen, Hover in Regalgrau. Für „Abmelden“ und Navigation.
- **Destructive:** zarter Rotgrund (10 %) mit roter Schrift, nie vollflächig rot.
- **Focus:** Überall ein voller 2px-Rahmen in der Akzentfarbe mit 2px Abstand (`.public-scope` und `.admin-theme :focus-visible`), nie ein halbtransparenter Ring. Beim Drücken 1px nach unten.

### Chips (Filter)
- **Reihen:** Lagerorte (mit „Alle“) und darunter Kategorien (Homebox-Tags, Antippen filtert, nochmal hebt auf). Am Handy horizontal scrollend, am Desktop umbrechend. In Layout A stehen beide am Desktop als Listen in der Seitenleiste. „Nur verfügbare“ ist kein Chip, sondern ein Schalter neben der Anzahl, und erscheint nur, wenn etwas verliehen ist.
- **Style:** Pille, Höhe 36px, Haarlinie, Papiergrund, 14px. Optionaler Zähler in 60 % Deckkraft.
- **State:** Aktiv in Akzentfarbe voll gefüllt (`aria-pressed`). Inaktiv mit Hover in Regalgrau.

### Status-Badge (Signatur)
Das Herzstück: ein kleines Schild, das ehrlich sagt, ob etwas da ist.
- Pille, 12px/500, 2px × 8px Innenabstand, 1px Innenring in der Statusfarbe bei 20 % und ein 6px-Punkt vor dem Text.
- Texte: „Verfügbar“, „N verfügbar“, „X von Y verfügbar“, „Verliehen bis TT.MM.“. Ohne Mengenfreigabe keine Zahlen.
- Auf Karten nur Ausnahmen (siehe Ausnahmen-Rule).
- Nicht verfügbare Kacheln bekommen zusätzlich einen 40 % Papier-Schleier und werden entsättigt.

### Cards / Containers
- **Item-Kachel:** 14px Radius, Haarlinie, Papiergrund, Hauch-Schatten. Foto 4:3 oben (bei Hover 3 % Zoom), darunter 12px Innenabstand mit Name, Unterzeile und Badge plus Lagerort. Optionales Pillen-Schild „Anleitung“ oben rechts auf dem Foto.
- **Listenzeile (Layout C):** 56px-Thumbnail, Name und Unterzeile, Badge rechts. Zeilen durch Haarlinien in einem gerundeten Kasten getrennt.
- **Kontaktkasten:** Regalgrau bei 40 %, Haarlinie, 16px Innenabstand. Sprechblase mit „Ausleihen? Frag einfach“, darunter optional „So läuft's“.
- **Faktentabelle / Anhangliste:** gerundeter Kasten mit Haarlinien-Zeilen, Beschriftung in Bleistiftgrau.

### Inputs / Fields
- **Style:** Haarlinie, Papiergrund, 10px Radius. Die Suche ist 40px hoch mit Lupe links und Leeren-Kreuz rechts, mobil in 16px Schrift (verhindert iOS-Zoom).
- **Focus:** Rahmen in Ring-Farbe plus 3px Ring bei 50 %.
- **Error:** roter Rahmen und Ring bei 20 %, Meldung als `role="alert"` in Rot darunter.

### Navigation
- **Admin-Kopf:** App-Logo (28px) mit „Homebox Front“ in 600. Daneben Textlinks als Tabs (siehe Admin-Navigation), rechts „Abmelden“ als Ghost-Button.
- **Zurück-Link (Detail):** Pfeil, Page-Logo (20px) und Page-Titel in Bleistiftgrau, beim Hover in Tinte.

### Admin-Formulare
Fehler stehen am betroffenen Abschnitt (rot, `role="alert"`), die Seite springt dorthin und fokussiert das erste Feld. Unten neben dem mitlaufenden Speichern-Balken steht nur „Nicht gespeichert. Zum Feld“. Formulare senden per `onSubmit` statt per `action`-Prop, damit Eingaben bei Fehlern erhalten bleiben. Toasts sind neutral (keine Ampelfarben), Erfolg im Admin in Homebox-Grün.

### Verleih-Liste (Admin)
Verliehene Items zuerst, je Zeile ein ruhiger Outline-Button „Verleihen“ (Primär nur „Eintragen“ im offenen Formular), „Ist zurück“ für Rückgaben, „Alles verliehen“ statt deaktiviertem Button. Datum mit Schnellwahl (Bis Sonntag, 1 Woche, 2 Wochen), bekannte Namen als Vorschläge. 50 Zeilen, dann „Weitere anzeigen“. Am Handy alle Bedienelemente mindestens 40px hoch.

### Verleih auf der Detailseite (nur Admin)
Ist der Admin eingeloggt, zeigt die öffentliche Detailseite unter Status und Lagerort einen Kasten „Verleih · Nur für dich sichtbar“ im Admin-Orange (`.admin-theme`, Rahmen 45 % Markisen-Orange). Darin dieselbe Verleih-Zeile wie im Admin, ohne Bild und Kopf. Besucher bekommen weder den Kasten noch Empfänger-Namen ins HTML.

### Admin-Navigation
Der aktive Tab hat eine 12 % Orange-Tönung mit Markisen-Schrift. Inaktive Tabs sind bleistiftgrau, beim Hover kommt eine Regalgrau-Fläche. Beim Tastaturfokus zeigen alle Tabs einen 3px-Ring in Orange.

### Kontaktwege
Eigene Felder für Telegram, Mail und Telefon (in dieser Reihenfolge), darunter „Weitere Hinweise“ als Freitext. Jeder Weg wird zu einem Button: der erste im Akzent, weitere in Regalgrau (secondary). Am Handy in der festen Leiste der erste breit, weitere als 48px-Symbol-Buttons. Im Kontaktkasten die Wege als Liste mit Symbol (Papierflieger, Umschlag, Hörer). Sprungziele sind pro Page/Item eindeutig (`kontakt-<slug>`, `kontakt-<itemId>`), weil Next vorige Seiten unsichtbar im DOM behält.

### Anfrage-Button (Detailseite)
Am Handy als feste Leiste unten (48px Button, volle Breite, Safe-Area), am Desktop direkt unter Status und Lagerort: Primär-Button 44px hoch mit Sprechblase („Per Mail anfragen“, „Per Signal anfragen“ …). Er nutzt den ersten Kontaktweg der Page, bei Mail mit Betreff und Text samt Item-Name. Darüber der erste Satz aus „So läuft's“ als Kurzinfo; nur wenn dort mehr steht, folgt „Mehr dazu ↓“ zum Kontaktkasten. Kein eigener Kontakt-Link, das machen die Buttons. Auf Listen gibt es denselben Hinweis als Textlink über den Filtern, wenn der Kontakt erst unten steht.

### Galerie
Wischbare Bildreihe auf weißem Rahmen (Produktfotos haben meist weißen Grund), Zähler „n / m“ unten rechts. Thumbnails sind ein einziger Tab-Stopp mit Pfeiltasten. Am Desktop läuft die Galerie beim Scrollen mit (sticky). Ein Tipp aufs Bild öffnet die Großansicht als natives `<dialog>` auf fast schwarzem Grund, mit Wischen, Pfeiltasten, Esc und am Handy einer Leiste unten (zurück, Schließen, weiter). Danach liegt der Fokus wieder auf dem Bild.

### Page-Logo
Wird nie beschnitten oder verzerrt. Im Dunkelmodus liegt es auf einer weißen Kachel mit 6px Radius. In A und C 36px hoch neben dem Titel. In B 56–64px hoch auf einer weißen Kachel mit 14px Radius, damit dunkle Logos auf dem dunklen Header lesbar bleiben. Auf der Passwortseite 56px.

## Do's and Don'ts

### Do:
- **Do** Tippziele auf öffentlichen Seiten mindestens 44px hoch machen (Suche, Mehr-Button, Anfrage-Button, Zurück-Link).
- **Do** Inhalte mit `minmax(0,1fr)`-Spalten und `min-w-0` bauen. Lange deutsche Wörter dürfen eine Seite am Handy nie verbreitern.
- **Do** die Verfügbarkeit auf jeder Ansicht als Status-Badge mit Punkt zeigen, nie nur als Text oder nur als Farbe.
- **Do** Interaktion ausschließlich über `--primary` färben, damit der Page-Akzent überall greift.
- **Do** Flächen durch 1px-Haarlinien und Regalgrau trennen. Schatten nur als Hauch oder bei Hover.
- **Do** Logos und Fotos mit `object-contain` bzw. `object-cover` in festen Formaten zeigen (Fotos 4:3).
- **Do** mobil mit 16px Seitenrand, 16px Suchschrift und horizontal scrollenden Chips bauen.
- **Do** Kontrast nach WCAG 2.2 AA einhalten, auch für Schrift auf dem Page-Akzent.

### Don't:
- **Don't** Grün, Bernstein oder Rosé für irgendetwas anderes als Verfügbarkeit verwenden.
- **Don't** Markisen-Orange oder Homebox-Grün auf öffentlichen Pages einsetzen. Dort gehört die Farbe dem Verleiher.
- **Don't** Streifen- oder Markisenbänder als Deko in der Oberfläche einsetzen (ausprobiert und verworfen). Die Markise lebt nur im Logo.
- **Don't** Weiß auf dem Original-Orange #ea7a35 setzen (2.9:1). Im Hellmodus gehört Weiß nur auf Markise tief #b84f16.
- **Don't** große Flächen in der Akzentfarbe füllen. Ausnahme ist die Tönung des Schaufenster-Headers.
- **Don't** in Ruhe Schatten stärker als `shadow-sm` verwenden.
- **Don't** eine zweite Schriftfamilie für Überschriften einführen.
