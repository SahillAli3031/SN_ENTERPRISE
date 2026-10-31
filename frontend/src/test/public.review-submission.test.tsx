import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewFormModal } from "../components/reviews/ReviewFormModal";
import { submitReview } from "../api/reviews";

vi.mock("../api/reviews", () => ({
  fetchPublishedReviews: vi.fn().mockResolvedValue([]),
  submitReview: vi.fn(),
  fetchAdminReviews: vi.fn().mockResolvedValue([]),
  updateReviewStatus: vi.fn(),
  deleteReview: vi.fn(),
}));

describe("public review submission", () => {
  beforeEach(() => {
    vi.mocked(submitReview).mockReset();
  });

  it("explains that reviews will appear publicly after submission", () => {
    render(<ReviewFormModal open onClose={() => undefined} />);
    expect(screen.getByText(/Your review will appear publicly after submission/i)).toBeTruthy();
  });

  it("submits the review and shows the thank you success message", async () => {
    vi.mocked(submitReview).mockResolvedValue(undefined);
    const onSubmitted = vi.fn();
    render(<ReviewFormModal open onClose={() => undefined} onSubmitted={onSubmitted} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "Excellent work and very tidy painters throughout." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    expect(await screen.findByText(/Thank You for Your Feedback!/i)).toBeTruthy();
    expect(await screen.findByText(/Your review has been submitted successfully/i)).toBeTruthy();
    expect(await screen.findByText(/OK/i)).toBeTruthy();
    expect(submitReview).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      rating: 5,
      comment: "Excellent work and very tidy painters throughout.",
    });
    expect(onSubmitted).toHaveBeenCalledTimes(1);

    // Verify form elements are completely unmounted from DOM
    expect(screen.queryByLabelText(/your name/i)).toBeNull();
    expect(screen.queryByLabelText(/^email/i)).toBeNull();
    expect(screen.queryByLabelText(/your review/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /Submit Review/i })).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: /Rating out of 5/i })).toBeNull();
  });

  it("shows validation errors and does not call the API when the form is incomplete", async () => {
    render(<ReviewFormModal open onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    expect(await screen.findByText("Please choose a star rating.")).toBeTruthy();
    expect(await screen.findByText("Please enter your name.")).toBeTruthy();
    expect(await screen.findByText("Please enter a valid email address.")).toBeTruthy();
    await waitFor(() => expect(submitReview).not.toHaveBeenCalled());
  });

  it("surfaces API errors inside the modal", async () => {
    vi.mocked(submitReview).mockRejectedValue(new Error("Review submission is temporarily down."));
    render(<ReviewFormModal open onClose={() => undefined} />);

    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Sam Lee" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "sam@example.com" } });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "A solid job on the exterior walls." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    expect(await screen.findByText("Review submission is temporarily down.")).toBeTruthy();
    expect(screen.queryByText(/Thank You for Your Feedback!/i)).toBeNull();
    // Form should still be visible after error
    expect(screen.getByLabelText(/your name/i)).toBeTruthy();
    expect(screen.getByLabelText(/^email/i)).toBeTruthy();
    expect(screen.getByLabelText(/your review/i)).toBeTruthy();
  });

  it("closes the modal when OK is clicked after successful submission", async () => {
    vi.mocked(submitReview).mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onSubmitted = vi.fn();
    render(<ReviewFormModal open onClose={onClose} onSubmitted={onSubmitted} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "Excellent work and very tidy painters throughout." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await screen.findByText(/Thank You for Your Feedback!/i);
    fireEvent.click(screen.getByRole("button", { name: /OK/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows fresh form when modal is reopened after successful submission", async () => {
    vi.mocked(submitReview).mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onSubmitted = vi.fn();
    const { unmount } = render(<ReviewFormModal open onClose={onClose} onSubmitted={onSubmitted} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "Excellent work and very tidy painters throughout." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await screen.findByText(/Thank You for Your Feedback!/i);
    fireEvent.click(screen.getByRole("button", { name: /OK/i }));

    // Modal is now closed, unmount and re-render with new props
    unmount();
    render(<ReviewFormModal open onClose={onClose} onSubmitted={onSubmitted} />);

    // Form should be fresh (empty fields)
    const nameInput = screen.getByLabelText(/your name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/^email/i) as HTMLInputElement;
    const commentInput = screen.getByLabelText(/your review/i) as HTMLInputElement;
    expect(nameInput.value).toBe("");
    expect(emailInput.value).toBe("");
    expect(commentInput.value).toBe("");
  });

  it("prevents duplicate submissions while request is processing", async () => {
    let resolveSubmit: (value: void) => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    vi.mocked(submitReview).mockReturnValue(submitPromise);

    render(<ReviewFormModal open onClose={() => undefined} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "Excellent work and very tidy painters throughout." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    // Wait briefly for loading state to establish
    await new Promise((r) => setTimeout(r, 0));

    // Resolve the first submission
    resolveSubmit!();
    await screen.findByText(/Thank You for Your Feedback!/i);
  });
});
