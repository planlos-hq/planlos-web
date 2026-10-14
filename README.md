# planlos-web

Vue-Frontend des Stundenplan-Assistenzsystems PlanLos. Das Backend liegt in
[planlos-server](https://github.com/planlos-hq/planlos-server).

## Starten mit Docker Compose

```bash
cp .env.example .env   # bei Bedarf anpassen
docker compose up -d --build   # http://127.0.0.1:8002
```

| Variable            | Bedeutung                                               |
| ------------------- | ------------------------------------------------------- |
| `URL_BASE`          | Pfad, unter dem die App ausgeliefert wird (Build)       |
| `VITE_API_BASE_URL` | Pfad bzw. URL der Backend-API (Build)                   |
| `WEB_PORT`          | Port auf dem Host (Standard `8002`)                     |
| `API_UPSTREAM`      | planlos-server aus Sicht des Containers; nginx leitet `/api/` dorthin weiter (Standard `http://host.docker.internal:8004`) |
| `SETTINGS_FILE`     | `settings.yml`, die in den Container gemountet wird     |

## Einstellungen (Hilfe, Impressum, About)

Die Inhalte der Dialoge unten rechts stehen in
[`settings.yml`](settings.yml): je Abschnitt ein `text` und ein
`link`, für About zusätzlich `images`. Leere Werte (`""`) blenden die Zeile aus.

Die Datei wird zur Laufzeit geladen. Mit Compose ist sie in den Container
gemountet, Änderungen sind also nach einem Neuladen der Seite sichtbar, ohne
neu zu bauen. Bilder für About z. B. unter `public/about/` ablegen.

## Entwicklung

Mit Nix: `direnv allow` bzw. `nix develop`.

```bash
npm install
npm run dev     # http://localhost:8005, API-Proxy auf localhost:8004
npm run build
npm run lint
npm test
```

Für `npm run dev` werden `VITE_API_BASE_URL` und `VITE_SHIB_USERNAME` aus `.env`
gelesen (siehe [`.env.example`](.env.example)).

**Keine Passwörter, Schlüssel, echten Namen, Benutzernamen, Hostnamen,
Personenfotos oder Serverkonfigurationen committen.**
