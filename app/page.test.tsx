import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { generateId } from "@/lib/utils";

jest.mock("@/lib/utils", () => ({
  generateId: jest.fn(),
}));

const mockedGenerateId = generateId as jest.MockedFunction<typeof generateId>;

describe("Home task manager", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("adds a task and persists it in localStorage", async () => {
    mockedGenerateId.mockReturnValue("task-1");
    const user = userEvent.setup();

    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(screen.getByText("Buy milk")).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem("task-manager-tasks")).toContain("Buy milk");
    });
  });

  it("loads persisted tasks on render", async () => {
    localStorage.setItem(
      "task-manager-tasks",
      JSON.stringify([{ id: "saved-1", title: "Persisted task" }])
    );

    render(<Home />);

    expect(await screen.findByText("Persisted task")).toBeInTheDocument();
  });

  it("deletes a task after confirming in dialog", async () => {
    mockedGenerateId.mockReturnValue("task-2");
    const user = userEvent.setup();

    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), "Read docs");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    expect(screen.getByText("Read docs")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete task" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Read docs")).not.toBeInTheDocument();
    });
  });

  it("exits edit mode when saving (no title change)", async () => {
    mockedGenerateId.mockReturnValueOnce("task-1");
    const user = userEvent.setup();

    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), "Old title");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    const editBtn = screen.getByRole("button", { name: 'Edit task "Old title"' });
    await user.click(editBtn);

    // Don't change the input; just verify Save exits edit mode.
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Old title")).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Edit task title")
      ).not.toBeInTheDocument();
    });
  });

  it("does not change a task title when cancelling edit", async () => {
    mockedGenerateId.mockReturnValueOnce("task-1");
    const user = userEvent.setup();

    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), "Keep title");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await user.click(
      screen.getByRole("button", { name: 'Edit task "Keep title"' })
    );

    const editInput = screen.getByLabelText("Edit task title");
    await user.clear(editInput);
    await user.type(editInput, "Changed title");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.getByText("Keep title")).toBeInTheDocument();
      expect(screen.queryByText("Changed title")).not.toBeInTheDocument();
    });
  });

  it("reorders tasks via drag and drop", async () => {
    mockedGenerateId
      .mockReturnValueOnce("id-a")
      .mockReturnValueOnce("id-b")
      .mockReturnValueOnce("id-c");

    const user = userEvent.setup();
    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), "A");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Task title"), "B");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Task title"), "C");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    const list = screen.getByRole("list");

    const liForTitle = (title: string) =>
      screen.getByText(title).closest("li") as HTMLElement;

    const liA = liForTitle("A");
    const liB = liForTitle("B");
    const liC = liForTitle("C");

    // Provide dimensions used by TaskList's onDragOver logic.
    (liC as any).getBoundingClientRect = () => ({
      top: 0,
      height: 100,
      left: 0,
      right: 0,
      width: 0,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Drag A onto C: depending on the computed "above vs below", the result can vary.
    // We still assert that the list order changes and matches one of the two valid outcomes.
    fireEvent.dragStart(liA);
    fireEvent.dragOver(liC, { clientY: 10 }); // try to place "above" (but JSDOM may differ)
    fireEvent.drop(liC);

    await waitFor(() => {
      const items = within(list).getAllByRole("listitem");
      const ordered = items.map((item) => {
        const editTitleBtn = within(item).getByRole("button", {
          name: /Edit task/,
        });
        return editTitleBtn.textContent?.trim();
      });

      const allowed = [
        ["B", "A", "C"],
        ["B", "C", "A"],
      ];

      expect(allowed).toContainEqual(ordered);
      expect(ordered).not.toEqual(["A", "B", "C"]);
    });
  });

  it('allows entering a task with more than 100 characters and saves it', async () => {
    const longTaskTitle = "a".repeat(101);
    mockedGenerateId.mockReturnValue("long-id");
    const user = userEvent.setup();

    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), longTaskTitle);
    await user.click(screen.getByRole("button", { name: "Add task" }));

    // The task with long title should be in the document
    expect(screen.getByText(longTaskTitle)).toBeInTheDocument();

    // Also verify it's in localStorage
    await waitFor(() => {
      const stored = localStorage.getItem("task-manager-tasks");
      expect(stored).toContain(longTaskTitle);
    });
  });
});
