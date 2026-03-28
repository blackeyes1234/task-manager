import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import {
  createTask,
  deleteTaskById,
  listTasks,
  updateTaskCompleted,
  updateTaskTitle,
} from "@/lib/taskApi";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

jest.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: jest.fn(),
}));

jest.mock("@/lib/taskApi", () => ({
  listTasks: jest.fn(),
  createTask: jest.fn(),
  updateTaskTitle: jest.fn(),
  updateTaskCompleted: jest.fn(),
  deleteTaskById: jest.fn(),
}));

const mockedListTasks = listTasks as jest.MockedFunction<typeof listTasks>;
const mockedCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockedUpdateTaskTitle = updateTaskTitle as jest.MockedFunction<
  typeof updateTaskTitle
>;
const mockedUpdateTaskCompleted = updateTaskCompleted as jest.MockedFunction<
  typeof updateTaskCompleted
>;
const mockedDeleteTaskById = deleteTaskById as jest.MockedFunction<
  typeof deleteTaskById
>;

const mockedCreateBrowserSupabaseClient =
  createBrowserSupabaseClient as jest.MockedFunction<
    typeof createBrowserSupabaseClient
  >;

function mockSignedInSupabase() {
  const sessionUser = {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: "",
  };
  mockedCreateBrowserSupabaseClient.mockReturnValue({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: sessionUser,
            access_token: "at",
            refresh_token: "rt",
            expires_in: 3600,
            token_type: "bearer",
          },
        },
        error: null,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  } as ReturnType<typeof createBrowserSupabaseClient>);
}

describe("Home task manager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignedInSupabase();
    mockedListTasks.mockResolvedValue([]);
    mockedCreateTask.mockImplementation(
      async (_client, { title, priority, dueDate }) => ({
        id: `id-${title}`,
        title,
        completed: false,
        priority,
        dueDate,
      })
    );
    mockedUpdateTaskTitle.mockImplementation(async (_client, id, title) => ({
      id,
      title,
      completed: false,
      priority: "Medium",
      dueDate: null,
    }));
    mockedUpdateTaskCompleted.mockImplementation(
      async (_client, id, completed) => ({
        id,
        title: "Updated",
        completed,
        priority: "Medium",
        dueDate: null,
      })
    );
    mockedDeleteTaskById.mockResolvedValue();
  });

  it("adds a task using Supabase API", async () => {
    const user = userEvent.setup();

    render(<Home />);
    await waitFor(() => {
      expect(mockedListTasks).toHaveBeenCalledTimes(1);
    });
    await screen.findByLabelText("Task title");

    await user.type(screen.getByLabelText("Task title"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    expect(
      await screen.findByText("Task successfully added!")
    ).toBeInTheDocument();
    expect(mockedCreateTask).toHaveBeenCalledWith(expect.anything(), {
      title: "Buy milk",
      priority: "Medium",
      dueDate: expect.any(String),
    });
  });

  it("loads persisted tasks from Supabase on render", async () => {
    mockedListTasks.mockResolvedValueOnce([
      {
        id: "saved-1",
        title: "Persisted task",
        completed: false,
        priority: "Medium",
        dueDate: null,
      },
    ]);

    render(<Home />);

    expect(await screen.findByText("Persisted task")).toBeInTheDocument();
  });

  it("deletes a task after confirming in dialog", async () => {
    mockedCreateTask.mockResolvedValueOnce({
      id: "task-2",
      title: "Read docs",
      completed: false,
      priority: "Medium",
      dueDate: null,
    });
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByLabelText("Task title");

    await user.type(screen.getByLabelText("Task title"), "Read docs");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    expect(await screen.findByText("Read docs")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Delete task/ })
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Task has been deleted.")
    ).toBeInTheDocument();
    expect(mockedDeleteTaskById).toHaveBeenCalledWith(
      expect.anything(),
      "task-2"
    );

    await waitFor(() => {
      expect(screen.queryByText("Read docs")).not.toBeInTheDocument();
    });
  });

  it("exits edit mode when saving (no title change)", async () => {
    mockedCreateTask.mockResolvedValueOnce({
      id: "task-1",
      title: "Old title",
      completed: false,
      priority: "Medium",
      dueDate: null,
    });
    mockedUpdateTaskTitle.mockResolvedValueOnce({
      id: "task-1",
      title: "Old title",
      completed: false,
      priority: "Medium",
      dueDate: null,
    });
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByLabelText("Task title");

    await user.type(screen.getByLabelText("Task title"), "Old title");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    const editBtn = await screen.findByRole("button", {
      name: 'Edit task "Old title"',
    });
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

  it("shows an error toast when creating a task fails", async () => {
    mockedCreateTask.mockRejectedValueOnce(new Error("insert failed"));
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByRole("heading", { name: "Task Manager" });
    await screen.findByLabelText("Task title");
    await user.type(screen.getByLabelText("Task title"), "Will not persist");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    expect(
      await screen.findByText("Failed to add task. Please try again.")
    ).toBeInTheDocument();
  });

  it("shows a success toast when a task title is saved from the editor", async () => {
    mockedCreateTask.mockResolvedValueOnce({
      id: "task-edit-toast",
      title: "Alpha",
      completed: false,
      priority: "Medium",
      dueDate: null,
    });
    mockedUpdateTaskTitle.mockResolvedValueOnce({
      id: "task-edit-toast",
      title: "Beta",
      completed: false,
      priority: "Medium",
      dueDate: null,
    });
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByLabelText("Task title");

    await user.type(screen.getByLabelText("Task title"), "Alpha");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await user.click(
      await screen.findByRole("button", { name: 'Edit task "Alpha"' })
    );
    const editInput = screen.getByLabelText("Edit task title");
    await user.clear(editInput);
    await user.type(editInput, "Beta{Enter}");

    expect(
      await screen.findByText("Task updated successfully!")
    ).toBeInTheDocument();
  });

  it("does not change a task title when cancelling edit", async () => {
    mockedCreateTask.mockResolvedValueOnce({
      id: "task-1",
      title: "Keep title",
      completed: false,
      priority: "Medium",
      dueDate: null,
    });
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByLabelText("Task title");

    await user.type(screen.getByLabelText("Task title"), "Keep title");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await user.click(
      await screen.findByRole("button", { name: 'Edit task "Keep title"' })
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
    mockedCreateTask
      .mockResolvedValueOnce({
        id: "id-a",
        title: "A",
        completed: false,
        priority: "Medium",
        dueDate: null,
      })
      .mockResolvedValueOnce({
        id: "id-b",
        title: "B",
        completed: false,
        priority: "Medium",
        dueDate: null,
      })
      .mockResolvedValueOnce({
        id: "id-c",
        title: "C",
        completed: false,
        priority: "Medium",
        dueDate: null,
      });

    const user = userEvent.setup();
    render(<Home />);
    await screen.findByLabelText("Task title");

    await user.type(screen.getByLabelText("Task title"), "A");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Task title"), "B");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await user.type(screen.getByLabelText("Task title"), "C");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    const list = screen.getByRole("list");

    const liForTitle = (title: string) =>
      screen.getByText(title).closest("li") as HTMLElement;

    await screen.findByText("A");
    await screen.findByText("C");
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

  it("allows entering a task with 100 characters (max length)", async () => {
    const longTaskTitle = "a".repeat(100);
    mockedCreateTask.mockResolvedValueOnce({
      id: "long-id",
      title: longTaskTitle,
      completed: false,
      priority: "Medium",
      dueDate: null,
    });
    const user = userEvent.setup();

    render(<Home />);
    await screen.findByLabelText("Task title");

    await user.type(screen.getByLabelText("Task title"), longTaskTitle);
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText(longTaskTitle)).toBeInTheDocument();
    expect(mockedCreateTask).toHaveBeenCalled();
  });
});
