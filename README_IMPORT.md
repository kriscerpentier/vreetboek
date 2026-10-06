# Mijn Kookboek v6 – automatische URL-import

Deze versie bevat een Supabase Edge Function `import-recipe`.

## Eenmalig in Supabase
1. Open Supabase Dashboard → Edge Functions.
2. Maak een nieuwe function met naam `import-recipe`.
3. Plak de inhoud van `supabase/functions/import-recipe/index.ts`.
4. Deploy.

De function is beveiligd met Supabase Auth en ondersteunt in deze eerste versie Dagelijkse Kost. De browser roept hem aan via `supabase.functions.invoke()`.

Daarna upload je de overige bestanden naar GitHub Pages.
