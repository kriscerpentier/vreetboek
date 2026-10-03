# Mijn Kookboek v2 — Supabase synchronisatie

Deze versie synchroniseert recepten, boodschappenlijst en weekplanning tussen Android en computer.

## Eenmalige installatie

1. Maak een gratis Supabase-project.
2. Open in Supabase **SQL Editor** en voer `supabase-schema.sql` volledig uit.
3. Zoek in Supabase bij **Project Settings → API** je Project URL en publieke **anon/publishable key**.
4. Open `config.js` en vervang:
   - `JOUW-PROJECT`
   - `JOUW-PUBLIEKE-ANON-OF-PUBLISHABLE-KEY`
5. Upload alle bestanden naar GitHub Pages en vervang de oude versie.
6. Open de website. Maak een account aan met e-mail + wachtwoord.
7. Gebruik op Android en computer hetzelfde account.

## Belangrijk
Gebruik alleen de publieke anon/publishable key in `config.js`. Zet NOOIT een `service_role` of andere geheime sleutel in de website.

De eerste keer dat je inlogt worden de bestaande lokale recepten van dit apparaat naar Supabase gekopieerd als je Supabase-database nog leeg is.

## Opmerking
De import van Instagram/Facebook/TikTok/YouTube en video-transcriptie is nog niet volledig automatisch. Dat is een aparte AI/import-stap die we daarna kunnen toevoegen.
