export type TaskDragPosition = "above" | "below";

/**
 * Returns a new id order after a drag-drop onto `droppedId`, mirroring TaskList drop logic.
 */
export function reorderTaskIdsAfterDrop(
  prevOrder: string[],
  draggedId: string,
  droppedId: string,
  dragOverPosition: TaskDragPosition | null
): string[] {
  if (!draggedId || draggedId === droppedId) return prevOrder;

  const updated = [...prevOrder];
  const fromIdx = updated.indexOf(draggedId);
  const toIdx = updated.indexOf(droppedId);
  if (fromIdx === -1 || toIdx === -1) return prevOrder;

  updated.splice(fromIdx, 1);

  const position = dragOverPosition ?? "above";
  let insertIdx = toIdx;

  if (position === "below") {
    if (fromIdx < toIdx) {
      insertIdx = toIdx;
    } else {
      insertIdx = toIdx + 1;
    }
  } else {
    if (fromIdx < toIdx) {
      insertIdx = toIdx - 1;
    } else {
      insertIdx = toIdx;
    }
  }

  insertIdx = Math.max(0, Math.min(insertIdx, updated.length));
  updated.splice(insertIdx, 0, draggedId);
  return updated;
}
