export type DesignerPortfolioPublic = {
  _id: string;
  displayName: string;
  headline?: string;
  bio?: string;
  specialties?: string[];
  images: { _id: string; relPath: string; caption?: string; /** From API when server builds absolute URLs */ url?: string }[];
  staff?: { firstName?: string; lastName?: string; jobTitle?: string };
};