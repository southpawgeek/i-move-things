// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LevelEditor } from "./LevelEditor";

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
  });
});

describe("LevelEditor", () => {
  const mockOnExport = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnExport.mockReset();
    mockOnCancel.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the editor with grid and controls", () => {
    render(<LevelEditor onExport={mockOnExport} onCancel={mockOnCancel} />);

    expect(screen.getByText("LEVEL EDITOR")).toBeDefined();
    expect(screen.getByText(/Wall/i)).toBeDefined();
    expect(screen.getByText(/EXPORT/i)).toBeDefined();
  });

  it("exports valid JSON and shows it in the DOM", async () => {
    render(<LevelEditor onExport={mockOnExport} onCancel={mockOnCancel} />);

    const exportBtn = screen.getByText(/EXPORT/i);
    fireEvent.click(exportBtn);

    const output = await screen.findByText(/width/i);
    expect(output).toBeDefined();
    expect(output.textContent).toContain('"width"');
    expect(output.textContent).toContain('"height"');
    expect(output.textContent).toContain('"tiles"');
  });

  it("clears the grid", () => {
    render(<LevelEditor onExport={mockOnExport} onCancel={mockOnCancel} />);

    const clearBtn = screen.getByText("Clear");
    fireEvent.click(clearBtn);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when back button is clicked", () => {
    render(<LevelEditor onExport={mockOnExport} onCancel={mockOnCancel} />);

    const cancelBtn = screen.getByText(/Back to Game/i);
    fireEvent.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
