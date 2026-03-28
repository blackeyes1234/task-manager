import { mergeVisibleOrderIntoFull } from "@/lib/mergeTaskOrder";

describe("mergeVisibleOrderIntoFull", () => {
  it("reorders when all tasks are visible", () => {
    const full = ["a", "b", "c"];
    const visible = ["a", "b", "c"];
    const next = ["c", "a", "b"];
    expect(mergeVisibleOrderIntoFull(full, visible, next)).toEqual(next);
  });

  it("injects reordered visible block before later non-visible ids", () => {
    const full = ["a", "d", "b"];
    const visible = ["a", "b"];
    const next = ["b", "a"];
    expect(mergeVisibleOrderIntoFull(full, visible, next)).toEqual([
      "b",
      "a",
      "d",
    ]);
  });

  it("handles active filter: completed after visible block in full list", () => {
    const full = ["a_active", "c_done", "b_active"];
    const visible = ["a_active", "b_active"];
    const next = ["b_active", "a_active"];
    expect(mergeVisibleOrderIntoFull(full, visible, next)).toEqual([
      "b_active",
      "a_active",
      "c_done",
    ]);
  });
});
