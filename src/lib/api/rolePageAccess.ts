/**
 * Role Page Access API
 * Stores and retrieves which pages each role can see.
 * Uses localStorage for persistence (no extra DB table needed).
 * CEO can override this for any role via the User Admin page.
 */

import { ALL_PAGES, getDefaultPagesForRole } from '../pageRegistry';

const STORAGE_KEY = 'cynex_role_page_access';

type RoleAccessMap = Record<string, string[]>; // role -> page keys[]

function loadMap(): RoleAccessMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveMap(map: RoleAccessMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Get the page keys enabled for a role. Falls back to defaults if not configured. */
export function getRolePages(role: string): string[] {
  const map = loadMap();
  if (map[role]) return map[role];
  return getDefaultPagesForRole(role);
}

/** Set the page keys for a role. */
export function setRolePages(role: string, pageKeys: string[]) {
  const map = loadMap();
  map[role] = pageKeys;
  saveMap(map);
}

/** Reset a role to defaults. */
export function resetRolePages(role: string) {
  const map = loadMap();
  delete map[role];
  saveMap(map);
}

/** Get all configured roles */
export const CONFIGURABLE_ROLES = ['Manager', 'Teacher', 'DM', 'Sales/HR', 'CEO'];
