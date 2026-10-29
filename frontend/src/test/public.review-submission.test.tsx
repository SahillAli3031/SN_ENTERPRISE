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

  it("explains that reviews are read by the team before publishing", () => {
    render(<ReviewFormModal open onClose={() => undefined} />);
    expect(screen.getByText(/reviews are read by our team before they are published/i)).toBeTruthy();
  });

  it("submits the review payload and shows the pending-moderation message", async () => {
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

    expect(await screen.findByText(/review received/i)).toBeTruthy();
    expect(
      await screen.findByText(/it will appear once approved/i),
    ).toBeTruthy();
    expect(submitReview).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      rating: 5,
      comment: "Excellent work and very tidy painters throughout.",
    });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
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
    vi.mocked(submitReview).mockRejectedValue(new Error("Review moderation is temporarily down."));
    render(<ReviewFormModal open onClose={() => undefined} />);

    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "Sam Lee" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "sam@example.com" } });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "A solid job on the exterior walls." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    expect(await screen.findByText("Review moderation is temporarily down.")).toBeTruthy();
    expect(screen.queryByText(/review received/i)).toBeNull();
  });
});
