import { ref } from "vue";
import { parse } from "yaml";

export type InfoSection = {
  text: string;
  link: string;
};

export type SiteSettings = {
  help: InfoSection;
  impressum: InfoSection;
  about: InfoSection & {
    images: string[];
    rare_image: string;
  };
};

const defaults: SiteSettings = {
  help: { text: "", link: "" },
  impressum: { text: "", link: "" },
  about: { text: "", link: "", images: [], rare_image: "" },
};

const settings = ref<SiteSettings>(defaults);
let loading: Promise<void> | undefined = undefined;

/**
 * Resolves a path from settings.yml against the app base URL; absolute URLs stay unchanged.
 *
 * @param path - Relative path or absolute URL
 * @returns URL usable in src/href attributes
 */
export function resolveAssetUrl(path: string): string {
  if (/^[a-z]+:\/\//i.test(path) || path.startsWith("/")) {
    return path;
  }
  const base = import.meta.env.BASE_URL;
  return `${base.endsWith("/") ? base : `${base}/`}${path}`;
}

async function load() {
  try {
    // no-cache so edits to a mounted settings.yml show up on reload
    const res = await fetch(resolveAssetUrl("settings.yml"), { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (parse(await res.text()) ?? {}) as Partial<SiteSettings>;
    settings.value = {
      help: { ...defaults.help, ...data.help },
      impressum: { ...defaults.impressum, ...data.impressum },
      about: { ...defaults.about, ...data.about },
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Could not load settings.yml", e);
  }
}

/**
 * Settings for the info dialogs, loaded once from settings.yml at runtime.
 *
 * @returns Reactive settings, filled with empty defaults until loaded
 */
export function useSiteSettings() {
  loading ??= load();
  return settings;
}
