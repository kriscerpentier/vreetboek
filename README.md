# Mijn Kookboek — eerste versie

Dit is een eerste werkende PWA-prototype voor persoonlijk gebruik.

## Wat werkt al
- recepten bewaren/bewerken/verwijderen
- zoeken en categorieën
- favorieten
- "gemaakt"
- ingrediënten en bereiding
- bron-URL
- boodschappenlijst
- weekplanning
- responsive Android/desktop interface
- installeren als PWA
- lokale opslag in de browser
- snelle tekst/URL-import als basis voor de latere AI-import

## Belangrijk
De eerste versie bewaart de data lokaal in de browser. De meegeleverde `supabase-schema.sql` is de basis voor de online synchronisatie die we als volgende stap kunnen aansluiten.

## Volgende stap
1. Gratis Supabase-project aanmaken.
2. `supabase-schema.sql` uitvoeren in SQL Editor.
3. Frontend koppelen aan Supabase-auth/database.
4. Deel-doel voor Android toevoegen.
5. AI endpoint toevoegen voor:
   - URL/caption -> recept
   - screenshot -> OCR -> recept
   - video/transcript -> recept
6. Afbeeldingen opslaan in Supabase Storage.

Gebruik voor productie nooit een AI API-key rechtstreeks in `app.js`; AI-calls moeten via een server-side/edge function lopen.
