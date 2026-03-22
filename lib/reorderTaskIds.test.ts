import { reorderTaskIdsAfterDrop } from "./reorderTaskIds";

describe("reorderTaskIdsAfterDrop", () => {
  it("moves an id before the target when position is above", () => {
    const order = ["a", "b", "c"];
    expect(reorderTaskIdsAfterDrop(order, "c", "a", "above")).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("returns unchanged order when dragged and dropped ids match", () => {
    const order = ["a", "b"];
    expect(reorderTaskIdsAfterDrop(order, "a", "a", "below")).toEqual(order);
  });
});
