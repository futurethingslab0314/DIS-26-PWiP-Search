# DIS PWiP Poster Search

This is a Vite + React site for browsing the DIS Posters & Work in Progress dataset.

## Data Source

The app now prefers live data from Google Sheets through the Vercel serverless endpoint at `/api/posters`.

Expected Google Sheet columns:

- `Theme`
- `Paper ID`
- `Title`
- `Contact Author`
- `Presentation day`
- `Contact Email` (optional)
- `Abstract` (optional)

If Google Sheet settings are missing or the fetch fails, the site automatically falls back to the local mock dataset in [src/data/posters.ts](/Users/yutingcheng/Library/CloudStorage/GoogleDrive-futurethingslab0314@gmail.com/My%20Drive/Future%20Things%20Lab/website/DIS-26-PWiP-Search/src/data/posters.ts).

## Local Development

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`
3. Fill either `GOOGLE_SHEET_CSV_URL` or `GOOGLE_SHEET_ID` + `GOOGLE_SHEET_GID`
4. Run:
   `npm run dev`

If you want local Vite dev to call a different data endpoint, set `VITE_POSTER_DATA_URL`.

## Google Sheet Setup

For the current implementation, the sheet tab must be readable as CSV.
This project uses the Google Sheets `gviz` CSV endpoint because it is more reliable than the standard `export?format=csv` URL for shared sheets.

You can do either of these:

1. Publish the sheet tab to web as CSV and paste that URL into `GOOGLE_SHEET_CSV_URL`
2. Share the sheet so Vercel can access the export URL, then set `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_GID`

The parser normalizes `Presentation day` values into:

- `Monday (15th)`
- `Tuesday (16th)`
- `Wednesday (17th)`

## Deploy To Vercel

Preview deploy:

```bash
vercel deploy -y
```

Before the live Google Sheet can work on Vercel, add the same environment variables in the Vercel project settings:

- `GOOGLE_SHEET_CSV_URL`, or
- `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_GID`

After changing Vercel env vars, redeploy once so the serverless function picks them up.
