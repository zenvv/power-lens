import { describe, expect, it } from "vitest";
import { summarizeTrigger } from "../../src/analysis/trigger-summary.js";
import { flowNode } from "../rules/helpers.js";

describe("summarizeTrigger", () => {
  it("categorizes a trigger with a recurrence config as scheduled", () => {
    const trigger = flowNode({ id: "Recorrencia", type: "Recurrence", recurrence: { frequency: "Day", interval: 1 } });
    const summary = summarizeTrigger(trigger);

    expect(summary.category).toBe("scheduled");
    expect(summary.recurrence).toEqual({ frequency: "Day", interval: 1 });
  });

  it("categorizes a Recurrence-typed trigger as scheduled even without a recurrence payload", () => {
    const trigger = flowNode({ id: "Recorrencia", type: "Recurrence" });
    expect(summarizeTrigger(trigger).category).toBe("scheduled");
  });

  it("categorizes Request/Manual triggers as manual", () => {
    expect(summarizeTrigger(flowNode({ id: "t", type: "Request" })).category).toBe("manual");
    expect(summarizeTrigger(flowNode({ id: "t", type: "Manual" })).category).toBe("manual");
  });

  it("categorizes a connector-backed trigger as event", () => {
    const trigger = flowNode({ id: "Quando_criado", type: "OpenApiConnectionWebhook", connectorName: "sharepointonline" });
    const summary = summarizeTrigger(trigger);

    expect(summary.category).toBe("event");
    expect(summary.connectorName).toBe("sharepointonline");
  });

  it("falls back to unknown for an unrecognized trigger shape", () => {
    const trigger = flowNode({ id: "t", type: "SomeFutureTriggerType" });
    expect(summarizeTrigger(trigger).category).toBe("unknown");
  });

  it("never throws for a trigger with no extra fields", () => {
    expect(() => summarizeTrigger(flowNode({ id: "t", type: "Unknown" }))).not.toThrow();
  });
});
