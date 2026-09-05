export interface NavEntry {
  label: string;
  href: string;
}

/**
 * Deliberately small right now — see dictionaries/kk.ts. This is
 * infrastructure (locale cookie, switcher, dictionary loader), not a
 * finished translation: extend this shape and both dictionaries together
 * as more of the site gets real, reviewed Kazakh copy.
 */
export interface Dictionary {
  nav: NavEntry[];
  languageSwitcher: {
    label: string;
    ru: string;
    kk: string;
  };
}
