"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collectAttribution } from "@/app/lib/attribution";
import { trackEvent } from "@/app/lib/analytics";
import type { CostLineItem, NapkinCalculationResult, NapkinInputs } from "@/app/lib/napkin/types";
import { runNapkinCalculation } from "@/app/lib/napkin/calculations";
import IntroScreen from "./IntroScreen";
import BusinessStepScreen, { type BusinessStepValues } from "./BusinessStepScreen";
import TransactionStepScreen, { type TransactionStepValues } from "./TransactionStepScreen";
import DirectCostsStepScreen from "./DirectCostsStepScreen";
import MonthlyCostsStepScreen from "./MonthlyCostsStepScreen";
import SurvivalNumberStepScreen, { type RhythmValues } from "./SurvivalNumberStepScreen";
import RealityCheckStepScreen, { type RealityCheckValues } from "./RealityCheckStepScreen";
import SnapshotView from "./SnapshotView";
import CommunityInvite, { type CommunityJoinValues } from "./CommunityInvite";

const STORAGE_KEY = "napkin-principle:v1";
const TOTAL_STEPS = 6;

type Step = "intro" | "business" | "transaction" | "directCosts" | "monthlyCosts" | "survival" | "realityCheck" | "submitting" | "submit_error" | "snapshot";

const EMPTY_INPUTS: NapkinInputs = {
  businessName: "",
  businessStage: "idea",
  whatItSells: "",
  currency: "USD",
  transactionSingular: "",
  transactionPlural: "",
  sellingPrice: 0,
  directCostItems: [],
  monthlyCostItems: [],
  tradingDaysPerMonth: null,
  openingHoursPerDay: null,
  capacityUnits: null,
  capacityUnitLabel: null,
  expectedMonthlyVolume: null,
  maxMonthlyCapacity: null,
  seasonality: null,
  reachability: null,
  priceConfidence: null,
  directCostConfidence: null,
  monthlyCostConfidence: null,
  volumeEvidence: "",
};

const INPUT_STEPS: Step[] = ["business", "transaction", "directCosts", "monthlyCosts", "survival", "realityCheck"];

type StoredState = { inputs: NapkinInputs; step: Step };

function loadStored(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function saveStored(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort only.
  }
}

function clearStored() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function NapkinPrinciple() {
  const [step, setStep] = useState<Step>("intro");
  const [inputs, setInputs] = useState<NapkinInputs>(EMPTY_INPUTS);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [result, setResult] = useState<NapkinCalculationResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();
  const [joinFieldErrors, setJoinFieldErrors] = useState<Record<string, string> | undefined>();
  const [joined, setJoined] = useState(false);
  const [declined, setDeclined] = useState(false);

  const hydrated = useRef(false);
  const startedTracked = useRef(false);

  const liveCalculation = useMemo(
    () => runNapkinCalculation({
      sellingPrice: inputs.sellingPrice,
      currency: inputs.currency,
      directCostItems: inputs.directCostItems,
      monthlyCostItems: inputs.monthlyCostItems,
      rhythm: {
        tradingDaysPerMonth: inputs.tradingDaysPerMonth,
        openingHoursPerDay: inputs.openingHoursPerDay,
        capacityUnits: inputs.capacityUnits,
      },
      expectedMonthlyVolume: inputs.expectedMonthlyVolume,
      maxMonthlyCapacity: inputs.maxMonthlyCapacity,
    }),
    [inputs]
  );

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadStored();
    if (stored && INPUT_STEPS.includes(stored.step)) {
      setInputs(stored.inputs);
      setStep(stored.step);
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (INPUT_STEPS.includes(step)) {
      saveStored({ inputs, step });
    }
  }, [step, inputs]);

  useEffect(() => {
    if (step === "snapshot") trackEvent("napkin_snapshot_viewed");
  }, [step]);

  const handleStart = () => {
    if (!startedTracked.current) {
      startedTracked.current = true;
      trackEvent("napkin_started");
    }
    setStep("business");
  };

  const stepIndex: Record<Step, number> = {
    intro: -1,
    business: 0,
    transaction: 1,
    directCosts: 2,
    monthlyCosts: 3,
    survival: 4,
    realityCheck: 5,
    submitting: 5,
    submit_error: 5,
    snapshot: 5,
  };

  const handleBusinessContinue = (values: BusinessStepValues) => {
    setInputs((prev) => ({ ...prev, ...values }));
    trackEvent("napkin_step_completed", { step: "business" });
    setStep("transaction");
  };

  const handleTransactionContinue = (values: TransactionStepValues) => {
    setInputs((prev) => ({ ...prev, ...values }));
    trackEvent("napkin_step_completed", { step: "transaction" });
    setStep("directCosts");
  };

  const handleDirectCostsContinue = (items: CostLineItem[]) => {
    setInputs((prev) => ({ ...prev, directCostItems: items }));
    trackEvent("napkin_step_completed", { step: "direct_costs" });
    setStep("monthlyCosts");
  };

  const handleMonthlyCostsContinue = (items: CostLineItem[]) => {
    setInputs((prev) => ({ ...prev, monthlyCostItems: items }));
    trackEvent("napkin_step_completed", { step: "monthly_costs" });
    setStep("survival");
  };

  const handleSurvivalContinue = (values: RhythmValues) => {
    setInputs((prev) => ({ ...prev, ...values }));
    trackEvent("napkin_step_completed", { step: "survival_number" });
    setStep("realityCheck");
  };

  const runSubmit = async (finalInputs: NapkinInputs) => {
    setStep("submitting");
    setSubmitError(null);
    const attribution = collectAttribution();

    try {
      const res = await fetch("/api/napkin/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: finalInputs, attribution, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        setStep("submit_error");
        return;
      }

      setSubmissionId(data.submissionId);
      setResult(data.result);
      trackEvent("napkin_completed", { interpretation_category: data.result.interpretation.category });
      clearStored();
      setStep("snapshot");
    } catch {
      setSubmitError("Something went wrong. Please check your connection and try again.");
      setStep("submit_error");
    }
  };

  const handleRealityCheckContinue = (values: RealityCheckValues) => {
    const finalInputs = { ...inputs, ...values };
    setInputs(finalInputs);
    trackEvent("napkin_step_completed", { step: "reality_check" });
    runSubmit(finalInputs);
  };

  const handleJoin = async (values: CommunityJoinValues) => {
    if (!submissionId) return;
    setJoinSubmitting(true);
    setJoinError(undefined);
    setJoinFieldErrors(undefined);

    try {
      const res = await fetch("/api/napkin/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, firstName: values.firstName, email: values.email, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setJoinFieldErrors(data.fieldErrors);
        setJoinError(data.error || "Something went wrong. Please try again.");
        setJoinSubmitting(false);
        return;
      }

      trackEvent("napkin_joined");
      trackEvent(data.emailSent ? "napkin_email_sent" : "napkin_email_send_failed");
      setJoined(true);
    } catch {
      setJoinError("Something went wrong. Please check your connection and try again.");
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleRestart = () => {
    clearStored();
    setInputs(EMPTY_INPUTS);
    setSubmissionId(null);
    setResult(null);
    setJoined(false);
    setDeclined(false);
    startedTracked.current = false;
    setStep("intro");
  };

  return (
    <div className="w-full">
      {step === "intro" && <IntroScreen onStart={handleStart} />}

      {step === "business" && <BusinessStepScreen index={stepIndex.business} total={TOTAL_STEPS} initial={inputs} onContinue={handleBusinessContinue} />}

      {step === "transaction" && (
        <TransactionStepScreen
          index={stepIndex.transaction}
          total={TOTAL_STEPS}
          initial={inputs}
          currency={inputs.currency}
          onBack={() => setStep("business")}
          onContinue={handleTransactionContinue}
        />
      )}

      {step === "directCosts" && (
        <DirectCostsStepScreen
          index={stepIndex.directCosts}
          total={TOTAL_STEPS}
          sellingPrice={inputs.sellingPrice}
          currency={inputs.currency}
          initialItems={inputs.directCostItems}
          onBack={() => setStep("transaction")}
          onContinue={handleDirectCostsContinue}
        />
      )}

      {step === "monthlyCosts" && (
        <MonthlyCostsStepScreen
          index={stepIndex.monthlyCosts}
          total={TOTAL_STEPS}
          currency={inputs.currency}
          initialItems={inputs.monthlyCostItems}
          onBack={() => setStep("directCosts")}
          onContinue={handleMonthlyCostsContinue}
        />
      )}

      {step === "survival" && (
        <SurvivalNumberStepScreen
          index={stepIndex.survival}
          total={TOTAL_STEPS}
          currency={inputs.currency}
          transactionLabel={inputs.transactionSingular}
          moneyRemainingPerTransaction={liveCalculation.contribution.moneyRemainingPerTransaction}
          monthlyOperatingCost={liveCalculation.survival.monthlyOperatingCost}
          initial={inputs}
          onBack={() => setStep("monthlyCosts")}
          onContinue={handleSurvivalContinue}
        />
      )}

      {step === "realityCheck" && (
        <RealityCheckStepScreen
          index={stepIndex.realityCheck}
          total={TOTAL_STEPS}
          survival={liveCalculation.survival}
          observable={liveCalculation.observable}
          initial={inputs}
          onBack={() => setStep("survival")}
          onContinue={handleRealityCheckContinue}
        />
      )}

      {step === "submitting" && (
        <div className="max-w-md py-24 text-center mx-auto" role="status" aria-live="polite">
          <p className="text-sm tracking-widest uppercase text-[#6b1f1f] font-semibold animate-pulse">Doing the arithmetic…</p>
        </div>
      )}

      {step === "submit_error" && (
        <div className="max-w-xl">
          <p className="text-base text-[#6b1f1f] mb-6" role="alert">
            {submitError}
          </p>
          <button onClick={() => runSubmit(inputs)} className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4">
            Try again →
          </button>
        </div>
      )}

      {step === "snapshot" && result && (
        <>
          <SnapshotView inputs={inputs} result={result} submissionId={submissionId} />
          {submissionId && (
            <div className="max-w-2xl">
              <CommunityInvite
                submissionId={submissionId}
                onJoin={handleJoin}
                submitting={joinSubmitting}
                errorMessage={joinError}
                fieldErrors={joinFieldErrors}
                joined={joined}
                declined={declined}
                onDecline={() => setDeclined(true)}
              />
              <button onClick={handleRestart} className="mt-10 text-xs tracking-widest uppercase text-[#1a1816]/40 hover:text-[#1a1816] transition-colors">
                Restart the exercise
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
