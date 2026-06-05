import { POSTER_DATASET } from '../src/data/posters';
import { buildGoogleSheetCsvUrl, mapCsvRowsToPosters, parseCsv } from '../src/lib/posters';

function respondWithFallback(res: any, reason: string) {
  res.status(200).json({
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
    error: reason,
    posters: POSTER_DATASET,
  });
}

export default async function handler(_req: any, res: any) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

  const csvUrl = buildGoogleSheetCsvUrl();
  if (!csvUrl) {
    return respondWithFallback(
      res,
      'Google Sheet is not configured yet. Set GOOGLE_SHEET_CSV_URL or GOOGLE_SHEET_ID in Vercel.',
    );
  }

  try {
    const response = await fetch(csvUrl, {
      headers: {
        Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Sheet request failed with ${response.status}`);
    }

    const csvText = await response.text();
    const posters = mapCsvRowsToPosters(parseCsv(csvText));

    if (posters.length === 0) {
      throw new Error('Google Sheet returned no valid poster rows.');
    }

    return res.status(200).json({
      source: 'google-sheet',
      fetchedAt: new Date().toISOString(),
      posters,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google Sheet fetch error.';
    return respondWithFallback(res, message);
  }
}
