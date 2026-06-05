const DEFAULT_SHEET_ID = '1PNhUT10w2Fepff6PrpzqtKRIy5bGwm3g_xOeZucS0d8';
const DEFAULT_SHEET_GID = '0';

const PRESENTATION_DAY_ALIASES = {
  'monday (15th)': 'Monday (15th)',
  'monday 15th': 'Monday (15th)',
  monday: 'Monday (15th)',
  'tuesday (16th)': 'Tuesday (16th)',
  'tuesday 16th': 'Tuesday (16th)',
  tuesday: 'Tuesday (16th)',
  'wednesday (17th)': 'Wednesday (17th)',
  'wednesday 17th': 'Wednesday (17th)',
  wednesday: 'Wednesday (17th)',
  unassigned: 'Unassigned',
};

const HEADER_ALIASES = {
  theme: 'theme',
  'paper id': 'paperId',
  paperid: 'paperId',
  title: 'title',
  'contact author': 'contactAuthor',
  contactauthor: 'contactAuthor',
  'contact email': 'contactEmail',
  contactemail: 'contactEmail',
  email: 'contactEmail',
  'presentation day': 'presentationDay',
  presentationday: 'presentationDay',
  abstract: 'abstract',
};

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

function cleanValue(value) {
  return String(value || '').trim().replace(/\r/g, '');
}

function normalizePresentationDay(value) {
  const normalized = cleanValue(value);
  if (!normalized) {
    return 'Unassigned';
  }

  return PRESENTATION_DAY_ALIASES[normalized.toLowerCase()] || 'Unassigned';
}

function extractEmailFromAuthor(rawAuthor) {
  const trimmed = cleanValue(rawAuthor);
  const emailMatch = trimmed.match(/\(([^()]+@[^()]+)\)$/);

  if (!emailMatch) {
    return { contactAuthor: trimmed };
  }

  return {
    contactAuthor: trimmed.replace(/\s*\([^()]+@[^()]+\)$/, '').trim(),
    contactEmail: emailMatch[1].trim(),
  };
}

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cleanValue(cell) !== ''));
}

function mapCsvRowsToPosters(rows) {
  if (!rows.length) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headerMap = headerRow.map((header) => HEADER_ALIASES[normalizeHeader(header)] || 'skip');

  return dataRows
    .map((row) => {
      const draft = {};

      row.forEach((cell, index) => {
        const field = headerMap[index];
        if (!field || field === 'skip') {
          return;
        }

        const value = cleanValue(cell);
        if (!value) {
          return;
        }

        if (field === 'presentationDay') {
          draft.presentationDay = normalizePresentationDay(value);
          return;
        }

        if (field === 'contactAuthor') {
          const authorData = extractEmailFromAuthor(value);
          draft.contactAuthor = authorData.contactAuthor;
          draft.contactEmail = draft.contactEmail || authorData.contactEmail;
          return;
        }

        draft[field] = value;
      });

      if (!draft.theme || !draft.paperId || !draft.title || !draft.contactAuthor) {
        return null;
      }

      return {
        theme: draft.theme,
        paperId: draft.paperId,
        title: draft.title,
        contactAuthor: draft.contactAuthor,
        contactEmail: draft.contactEmail,
        presentationDay: draft.presentationDay || 'Unassigned',
        abstract: draft.abstract,
      };
    })
    .filter(Boolean);
}

function buildGoogleSheetCsvUrl() {
  const directCsvUrl = cleanValue(process.env.GOOGLE_SHEET_CSV_URL);
  if (directCsvUrl) {
    return directCsvUrl;
  }

  const sheetId = cleanValue(process.env.GOOGLE_SHEET_ID) || DEFAULT_SHEET_ID;
  const gid = cleanValue(process.env.GOOGLE_SHEET_GID) || DEFAULT_SHEET_GID;

  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

module.exports = async (req, res) => {
  const csvUrl = buildGoogleSheetCsvUrl();

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

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

    if (!posters.length) {
      throw new Error('Google Sheet returned no valid poster rows.');
    }

    return res.status(200).json({
      source: 'google-sheet',
      fetchedAt: new Date().toISOString(),
      posters,
    });
  } catch (error) {
    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown Google Sheet fetch error.',
      posters: [],
    });
  }
};
