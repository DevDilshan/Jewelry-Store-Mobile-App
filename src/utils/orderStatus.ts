/** Matches backend / web `orderStatus.js` for takeaway feedback eligibility */
export function isOrderFeedbackEligible(status: string | undefined): boolean {
  return status === "Ready" || status === "Delivered" || status === "Shipped";
}
