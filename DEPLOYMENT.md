# FLD Gamemaster - Deployment Instructies

Deze app werkt NIET goed in de development preview op Chrome Android. Je moet de app deployen naar een echte hosting service.

## Optie 1: Vercel (Aanbevolen - Gratis)

1. **Maak een GitHub repository:**
   - Ga naar https://github.com/new
   - Upload alle bestanden van deze app

2. **Deploy naar Vercel:**
   - Ga naar https://vercel.com/new
   - Klik op "Import Git Repository"
   - Selecteer je GitHub repository
   - Klik op "Deploy"
   - Wacht 1-2 minuten

3. **Kopieer de URL:**
   - Na deployment krijg je een URL zoals: `jouw-app.vercel.app`
   - Deze URL werkt op ALLE browsers en apparaten

## Optie 2: Netlify (Ook gratis)

1. **Maak een GitHub repository** (zie boven)

2. **Deploy naar Netlify:**
   - Ga naar https://app.netlify.com/start
   - Klik op "Import from Git"
   - Selecteer je GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Klik op "Deploy site"

3. **Kopieer de URL:**
   - Je krijgt een URL zoals: `jouw-app.netlify.app`

## Belangrijk: Environment Variables

Vergeet niet om in Vercel of Netlify je environment variables toe te voegen:

- `VITE_SUPABASE_URL` (uit je .env bestand)
- `VITE_SUPABASE_ANON_KEY` (uit je .env bestand)
- `VITE_PUBLIC_URL` (de URL van je deployed app, bijv. `https://jouw-app.vercel.app`)

Je vindt de Supabase waardes in je `.env` bestand. De `VITE_PUBLIC_URL` vul je in NADAT je de eerste keer hebt deployed (dan krijg je de URL).

## Na Deployment

De app werkt nu op:
- Chrome (desktop en Android)
- Firefox
- Safari
- Alle andere browsers

Deel de URL met je deelnemers en ze kunnen direct meespelen!
