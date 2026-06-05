export type PresentationDay = 'Monday (15th)' | 'Tuesday (16th)' | 'Wednesday (17th)' | 'Unassigned' | '';

export interface Poster {
  theme: string;
  paperId: string;
  title: string;
  contactAuthor: string;
  contactEmail?: string;
  presentationDay: PresentationDay;
  abstract?: string; // Adding a brief academic abstract to enable advanced search experiences!
}

export interface PosterApiResponse {
  source: 'google-sheet' | 'fallback';
  fetchedAt: string;
  error?: string;
  posters: Poster[];
}
