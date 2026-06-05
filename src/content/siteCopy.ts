/**
 * 網站所有使用者可見文字集中於此檔案，修改後重新整理頁面即可生效。
 * Site-wide user-facing copy — edit here to update text across the app.
 */

export const siteCopy = {
  page: {
    title: "DIS'26 PWiP Search",
    name: 'DIS 2026 PWiP Poster Search',
    description:
      'A browse page for the DIS 2026 Pictorials and Work in Progress (PWiP) posters, featuring filtering by theme and presentation day.',
  },

  header: {
    subtitle: 'PWiP (Poster) Quick Search Page',
  },

  disclaimer: {
    lunchAttendance: {
      title: 'Lunch Break Station Attendance',
      bodyPrefix:
        'The specific day indicates when the author preferentially intends to be present at their poster station for presentation and discussion during the conference ',
      bodyHighlight: 'Lunch Break (12:30 – 14:00)',
      bodySuffix: '.',
    },
    fullExhibition: {
      title: '3-Day Full Exhibition & Connection',
      bodyPrefix: 'All physical posters remain ',
      bodyHighlight: 'on display during all 3 days of the conference',
      bodySuffix:
        '. Attendees are welcome to visit their posters at any time and connect with authors.',
    },
    receptionDinner: {
      label: 'EXHIBITION RECEPTION DINNER:',
      bodyPrefix: 'In addition, ',
      bodyHighlightAuthors: 'all registered authors',
      bodyMiddle: ' will also be physically present at their posters on ',
      bodyHighlightDate: 'Monday (June 15)',
      bodyMiddle2: ' during the official afternoon ',
      bodyHighlightEvent: 'Exhibition Reception Dinner',
      bodySuffix: ' to discuss with fellow attendees.',
    },
  },

  viewMode: {
    label: 'VIEW:',
    spreadsheet: 'Spreadsheet',
    spreadsheetTitle: 'Spreadsheet list layout (matches reference)',
    cardGrid: 'Card Grid',
    cardGridTitle: 'Modern card grid layout',
  },

  stats: {
    totalPosters: 'Total Posters',
    allTracks: 'All Tracks',
    monday: {
      shortLabel: 'Mon 15th',
      dateLabel: 'June 15',
    },
    tuesday: {
      shortLabel: 'Tue 16th',
      dateLabel: 'June 16',
    },
    wednesday: {
      shortLabel: 'Wed 17th',
      dateLabel: 'June 17',
    },
  },

  filters: {
    allDates: 'ALL DATES',
    dateTabLabels: {
      'Monday (15th)': 'JUNE 15',
      'Tuesday (16th)': 'JUNE 16',
      'Wednesday (17th)': 'JUNE 17',
    },
    themesLabel: 'Themes:',
    allThemes: 'All',
    searchPlaceholder: 'Search Paper ID, title words, author, or abstract text...',
    clearSearchAriaLabel: 'Clear query search',
    activeSpecifications: 'ACTIVE SPECIFICATIONS:',
    resetFilters: 'Reset Search Filters',
  },

  results: {
    filteredCount: (filtered: number, total: number) =>
      `${filtered} Posters Filtered // ${total} Total Registered`,
    loading: 'Loading poster data...',
    liveSource: 'Live from Google Sheet',
    dataLoadError: 'Google Sheet data could not be loaded. The site is not using any mock data.',
    apiNoRows: 'Poster API returned no poster rows.',
    apiLoadFailed: 'Unable to load Google Sheet data.',
  },

  emptyState: {
    title: 'No matching posters found',
    description:
      'Try clearing your search query or setting the Theme/Day dropdowns to "All Themes Tracks" to broaden your search.',
    clearButton: 'Clear All Filter Conditions',
  },

  table: {
    theme: 'Theme',
    paperId: 'Paper ID',
    title: 'Title',
    contactAuthor: 'Contact Author',
    meetUpTime: 'Meet Up Time',
    lunchTime: 'Lunch 12:30–14:00',
    unassigned: 'Unassigned',
  },

  footer: {
    copyright: '© 2026 ACM DIS PWiP Poster Search.',
    eventLabel: 'DIS 2026',
    location: 'Singapore',
  },
} as const;
