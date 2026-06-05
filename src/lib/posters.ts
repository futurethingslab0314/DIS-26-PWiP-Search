import { Poster, PresentationDay } from '../types';

const PRESENTATION_DAY_ALIASES: Record<string, PresentationDay> = {
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

const HEADER_ALIASES: Record<string, keyof Poster | 'skip'> = {
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

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

function cleanValue(value: string): string {
  return value.trim().replace(/\r/g, '');
}

function extractEmailFromAuthor(rawAuthor: string): { contactAuthor: string; contactEmail?: string } {
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

export function normalizePresentationDay(value: string): PresentationDay {
  const normalized = cleanValue(value);
  if (!normalized) {
    return 'Unassigned';
  }

  return PRESENTATION_DAY_ALIASES[normalized.toLowerCase()] ?? 'Unassigned';
}

export function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
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

export function mapCsvRowsToPosters(rows: string[][]): Poster[] {
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headerMap = headerRow.map((header) => HEADER_ALIASES[normalizeHeader(header)] ?? 'skip');

  const posters = dataRows.map((row): Poster | null => {
      const draft: Partial<Poster> = {};

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
          const { contactAuthor, contactEmail } = extractEmailFromAuthor(value);
          draft.contactAuthor = contactAuthor;
          draft.contactEmail = draft.contactEmail ?? contactEmail;
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
        presentationDay: draft.presentationDay ?? 'Unassigned',
        abstract: draft.abstract,
      } satisfies Poster;
    });

  return posters.filter((poster): poster is Poster => poster !== null);
}

export function buildGoogleSheetCsvUrl(): string | null {
  const directCsvUrl = process.env.GOOGLE_SHEET_CSV_URL?.trim();
  if (directCsvUrl) {
    return directCsvUrl;
  }

  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  if (!sheetId) {
    return null;
  }

  const gid = process.env.GOOGLE_SHEET_GID?.trim() || '0';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}
