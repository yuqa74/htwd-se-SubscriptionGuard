# SubscriptionGuard

SubscriptionGuard ist eine Desktop-App fuer die Verwaltung von Abonnements, wiederkehrenden Kosten, Kuendigungsfristen und Einsparpotenzialen. Das Projekt basiert auf einem modularen Frontend und ist bereits fuer eine Windows-App mit Tauri vorbereitet.

## Funktionen

- Abos anlegen, bearbeiten, duplizieren und loeschen
- Kategorien, Zahlungsmodelle und mehrere Waehrungen
- Monats- und Jahreskosten in einer Basiswaehrung
- Erinnerungen fuer Zahlungen, Verlaengerungen und Kuendigungsfristen
- Analyse von Nutzung, Nutzenbewertung und Sparpotenzial
- Vergleich mehrerer Abos innerhalb einer Kategorie
- 12-Monats-Vorschau und Kostenvisualisierung
- Monatsbudget mit Statusanzeige
- CSV-Import und CSV-Export
- JSON-Backup und Restore
- Lokale Speicherung per `localStorage`

## Projektstruktur

- `index.html`, `styles.css`, `app.js`: Einstieg ins Frontend
- `src/app-controller.js`: verbindet UI, Datenquelle und Aktionen
- `src/ui.js`: DOM-Logik und Rendering
- `src/analysis.js`: Berechnungen, Warnungen und Insights
- `src/services/api.js`: Schnittstelle fuer lokale oder spaetere Remote-Datenquelle
- `src/services/localRepository.js`: aktuelle lokale Persistenz
- `src-tauri/`: Tauri-Desktop-App
- `scripts/`: Hilfsskripte fuer Dist, Dev-Start und Build


## Team-Workflow

Branches:

- `main`: stabiler gemeinsamer Stand
- `frontend/desktop-ui`: UI, UX, Komponenten, Layout, Charts
- `backend/api-foundation`: API, Controller, Server-Grundstruktur
- `backend/database-schema`: Datenbankmodell, Migrationen, Persistence
- `desktop/tauri-polish`: Desktop-spezifische Details wie Icon, Installer, Fensterverhalten

Empfehlung:

- Nicht dauerhaft direkt auf `main` arbeiten
- Pro Feature oder Aufgabenblock einen eigenen Branch nutzen
- Danach Pull Request nach `main`

## Backend-Integration

Das Backend sollte an `src/services/api.js` andocken. Dort ist die Datenquelle bereits so vorbereitet, dass spaeter von lokalem Speicher auf echte HTTP-Endpunkte umgestellt werden kann.

Sinnvolle spaetere Endpunkte:

- `GET /state`
- `POST /state/import`
- `PUT /settings`
- `PUT /subscriptions/replace`
- `POST /subscriptions`
- `PUT /subscriptions/:id`
- `DELETE /subscriptions/:id`

Wichtig:

- UI und Backend moeglichst getrennt halten
- Nicht direkt in `src/ui.js` mit API-Logik anfangen
- Backend-Team sollte von `src/services/api.js` aus arbeiten

## Hinweise

- Generierte Ordner wie `dist`, `build` und `src-tauri/target` sind in `.gitignore`
- Das aktuelle App-Icon ist technisch vorhanden, kann aber spaeter noch ersetzt werden
- Nach Frontend-Aenderungen muss Tauri nicht neu eingerichtet werden, nur neu gebaut werden
