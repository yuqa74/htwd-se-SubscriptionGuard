# SubscriptionGuard

SubscriptionGuard ist eine lokale Desktop-aehnliche Web-App zur Verwaltung von Abonnements, wiederkehrenden Kosten, Kuendigungsfristen und Einsparpotenzialen.

## Enthaltene Funktionen

- Abos anlegen, bearbeiten, duplizieren und loeschen
- Kategorien, Zahlungsmodelle und mehrere Waehrungen
- Monats- und Jahreskosten in einer Basiswaehrung
- Erinnerungen fuer Zahlungen, Verlaengerungen und Kuendigungsfristen
- Analyse von Nutzung, Nutzenbewertung und Sparpotenzial
- Vergleich mehrerer Abos innerhalb einer Kategorie
- Reflexionsbereich fuer Nutzen-vs.-Kosten
- 12-Monats-Vorschau und Kostenvisualisierung
- Monatsbudget mit Statusanzeige
- CSV-Import und CSV-Export
- JSON-Backup und Restore
- Lokale Speicherung per `localStorage`

## Architektur

- [app.js]: kleiner Einstiegspunkt
- [src/app-controller.js]: verbindet UI, Datenquelle und Aktionen
- [src/ui.js]: komplette DOM- und Render-Schicht
- [src/analysis.js]: Geschaeftslogik fuer Kosten, Warnungen und Einsparpotenziale
- [src/services/api.js]: austauschbare Datenquelle, lokal heute, remote spaeter
- [src/services/localRepository.js]: lokale Persistenz
- [src/data/sampleSubscriptions.js]: Demo-Daten
- [src/utils.js]: gemeinsame Hilfsfunktionen

## Starten

Die App benoetigt kein Build-Tool.

1. [index.html] im Browser oeffnen.
2. Optional Demo-Daten laden.
3. Abos verwalten und Analysen direkt lokal nutzen.

## Desktop-Weiterentwicklung

Die Architektur ist jetzt so vorbereitet, dass spaeter zwei Wege moeglich sind:

- Desktop zuerst:
  Frontend in Tauri oder Electron packen und die aktuelle lokale Datenquelle weiterverwenden.
- Backend spaeter:
  In [src/services/api.js] von `mode: "local"` auf eine echte Remote-Implementierung umstellen.

## Tauri Windows App

Die App ist jetzt auf Tauri vorbereitet:

- [src-tauri/Cargo.toml](c:\Users\toqql\Desktop\SE I\src-tauri\Cargo.toml)
- [src-tauri/tauri.conf.json](c:\Users\toqql\Desktop\SE I\src-tauri\tauri.conf.json)
- [src-tauri/src/main.rs](c:\Users\toqql\Desktop\SE I\src-tauri\src\main.rs)
- [src-tauri/capabilities/default.json](c:\Users\toqql\Desktop\SE I\src-tauri\capabilities\default.json)
- [scripts/prepare-dist.ps1](c:\Users\toqql\Desktop\SE I\scripts\prepare-dist.ps1)
- [scripts/Run-TauriDev.ps1](c:\Users\toqql\Desktop\SE I\scripts\Run-TauriDev.ps1)
- [scripts/Build-TauriApp.ps1](c:\Users\toqql\Desktop\SE I\scripts\Build-TauriApp.ps1)

Der Dist-Schritt kopiert dein aktuelles Frontend in [dist](c:\Users\toqql\Desktop\SE I\dist), und Tauri verwendet genau diesen Ordner als Frontend-Basis.

### Build auf Windows

Voraussetzungen:

1. Microsoft C++ Build Tools mit `Desktop development with C++`
2. Rust mit MSVC-Toolchain
3. WebView2 Runtime

Danach:

1. `powershell -ExecutionPolicy Bypass -File .\scripts\Run-TauriDev.ps1`
2. `powershell -ExecutionPolicy Bypass -File .\scripts\Build-TauriApp.ps1`

Das Build-Ergebnis liegt spaeter typischerweise unter:

- `src-tauri\target\release\bundle\nsis\`
- `src-tauri\target\release\bundle\msi\`

## Spaetere Backend-Endpunkte

Sinnvolle Endpunkte waeren zum Beispiel:

- `GET /state`
- `POST /state/import`
- `PUT /settings`
- `PUT /subscriptions/replace`
- `POST /subscriptions`
- `PUT /subscriptions/:id`
- `DELETE /subscriptions/:id`
