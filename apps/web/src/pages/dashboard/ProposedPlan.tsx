import type { AllocationFailure } from "@brkroutnxdle/domain";

export function ProposedPlan({ proposals, failures, reviewBlocks }: {
  proposals: number; failures: AllocationFailure[]; reviewBlocks: () => void;
}) {
  return <section id="proposed-plan" aria-label="Proposed plan" style={{ margin: "0 16px" }}>
    Proposed plan · {proposals} proposed placements · {failures.length} unmet task requests
    {proposals === 0 && failures.length > 0 &&
      <button type="button" onClick={reviewBlocks}>Review shortfalls and blocks</button>}
  </section>;
}
