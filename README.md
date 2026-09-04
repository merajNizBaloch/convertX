# Convertly — PNG to JPG Converter

A privacy-first PNG to JPG converter built with Next.js.

## Architecture

The conversion happens entirely in the browser using Canvas. Images are never uploaded to a backend, so this project does not require a database, Supabase, storage, or API route.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy

Push the project to GitHub and import it into Vercel. No environment variables are required.
