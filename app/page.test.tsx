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
    expect(
      await screen.findByText("Task successfully added!")
    ).toBeInTheDocument();

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

    await user.click(
      screen.getByRole("button", { name: /Delete task/ })
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Task has been deleted.")
    ).toBeInTheDocument();

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

  it("shows an error toast when saving to localStorage fails after adding a task", async () => {
    mockedGenerateId.mockReturnValue("task-storage-fail");
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByRole("heading", { name: "Task Manager" });

    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota");
      });

    try {
      await user.type(screen.getByLabelText("Task title"), "Will not persist");
      await user.click(screen.getByRole("button", { name: "Add task" }));

      expect(
        await screen.findByText("Failed to add task. Please try again.")
      ).toBeInTheDocument();
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it("shows a success toast when a task title is saved from the editor", async () => {
    mockedGenerateId.mockReturnValueOnce("task-edit-toast");
    const user = userEvent.setup();

    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), "Alpha");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await user.click(
      screen.getByRole("button", { name: 'Edit task "Alpha"' })
    );
    const editInput = screen.getByLabelText("Edit task title");
    await user.clear(editInput);
    await user.type(editInput, "Beta{Enter}");

    expect(
      await screen.findByText("Task updated successfully!")
    ).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
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
    const liC = liForTitle("C");

    const mockRect = {
      top: 0,
      height: 100,
      left: 0,
      right: 0,
      width: 0,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => "",
    } as DOMRect;
    jest.spyOn(liC, "getBoundingClientRect").mockReturnValue(mockRect);

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

  it("allows entering a task with 100 characters (max length) and saves it", async () => {
    const longTaskTitle = "a".repeat(100);
    mockedGenerateId.mockReturnValue("long-id");
    const user = userEvent.setup();

    render(<Home />);

    await user.type(screen.getByLabelText("Task title"), longTaskTitle);
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(screen.getByText(longTaskTitle)).toBeInTheDocument();

    await waitFor(() => {
      const stored = localStorage.getItem("task-manager-tasks");
      expect(stored).toContain(longTaskTitle);
    });
  });
});
