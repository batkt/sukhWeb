/**
 * Helper function to get resident data from toots array first, then fallback to top-level properties
 * This ensures we prioritize data from the toots array over top-level properties
 * 
 * Example: If top-level toot is "" but toots[0].toot is "22", it will return "22"
 */
export function getResidentField(
  resident: any,
  field: 'toot' | 'davkhar' | 'orts' | 'duureg' | 'horoo' | 'soh' | 'bairniiNer',
  fallback?: any
): any {
  if (!resident) return fallback ?? null;
  
  // First try to get from toots array (prioritize first toot entry)
  // This handles cases where top-level field is empty but toots array has the value
  if (Array.isArray(resident.toots) && resident.toots.length > 0) {
    const firstToot = resident.toots[0];
    if (firstToot && firstToot.hasOwnProperty(field)) {
      const value = firstToot[field];
      // Return value even if it's 0 or false, only skip null/undefined/empty string
      if (value != null && value !== '') {
        return value;
      }
    }
  }
  
  // Fallback to top-level property only if toots array doesn't have the field or it's empty
  const topLevelValue = resident[field];
  if (topLevelValue != null && topLevelValue !== '') {
    return topLevelValue;
  }
  
  // Return fallback if provided
  return fallback ?? null;
}

/**
 * Get toot value from resident, prioritizing toots array
 */
export function getResidentToot(resident: any): string | null {
  return getResidentField(resident, 'toot', null);
}

/**
 * Get davkhar value from resident, prioritizing toots array
 */
export function getResidentDavkhar(resident: any): string | null {
  return getResidentField(resident, 'davkhar', null);
}

/**
 * Get orts value from resident, prioritizing toots array
 */
export function getResidentOrts(resident: any): string | null {
  return getResidentField(resident, 'orts', null);
}

/**
 * Get duureg value from resident, prioritizing toots array
 */
export function getResidentDuureg(resident: any): string | null {
  return getResidentField(resident, 'duureg', null);
}

/**
 * Get horoo value from resident, prioritizing toots array
 * Handles both object and string formats
 */
export function getResidentHoroo(resident: any): string | object | null {
  const value = getResidentField(resident, 'horoo', null);
  return value;
}

/**
 * Get soh value from resident, prioritizing toots array
 */
export function getResidentSoh(resident: any): string | null {
  return getResidentField(resident, 'soh', null);
}

/**
 * Get bairniiNer value from resident, prioritizing toots array
 */
export function getResidentBairniiNer(resident: any): string | null {
  return getResidentField(resident, 'bairniiNer', null);
}
