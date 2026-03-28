/**
 * Merges a new order for visible task IDs into the full ordered ID list.
 * Non-visible IDs keep their relative positions; visible IDs are replaced
 * once by `newVisibleIds` at the first visible slot.
 */
export function mergeVisibleOrderIntoFull(
  fullIds: string[],
  visibleIds: string[],
  newVisibleIds: string[]
): string[] {
  const visibleSet = new Set(visibleIds);
  const result: string[] = [];
  let injected = false;

  for (const id of fullIds) {
    if (!visibleSet.has(id)) {
      result.push(id);
    } else if (!injected) {
      result.push(...newVisibleIds);
      injected = true;
    }
  }

  return result;
}
