"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTIONS } from "@/app/lib/assessment/config";
import type { AssessmentContext } from "@/app/lib/assessment/types";
import type { ResultViewData } from "@/app/lib/assessment/present";
import { collectAttribution } from "@/app/lib/attribution";
import { trackEvent } from "@/app/lib/analytics";
import IntroScreen from "./IntroScreen";
import ContextScreen from "./ContextScreen";
import QuestionScreen from "./QuestionScreen";
import ProcessingScreen from "./ProcessingScreen";
import LeadGateForm, { type LeadGateSubmission } from "./LeadGateForm";
import ResultView from "./ResultView";

const STORAGE_KEY = "bidea-reality-check:v1";

type Step = "intro" | "context" | "question" | "processing" | "process_error" | "gate" | "result";

type StoredState = {
  context: AssessmentContext;
  rawAnswers: Record<string, string>;
  questionIndex: number;
  step: Step;
};

const EMPTY_CONTEXT: AssessmentContext = { ideaName: "", ideaDescription: "", stage: "A", location: null };

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
    // Best-effort only — a full/blocked localStorage shouldn't break the flow.
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

export default function BusinessIdeaRealityCheck({ paidCtaUrl }: { paidCtaUrl: string | null }) {
  const [step, setStep] = useState<Step>("intro");
  const [context, setContext] = useState<AssessmentContext>(EMPTY_CONTEXT);
  const [rawAnswers, setRawAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [resultData, setResultData] = useState<ResultViewData | null>(null);
  const [gateSubmitting, setGateSubmitting] = useState(false);
  const [gateError, setGateError] = useState<string | undefined>();
  const [gateFieldErrors, setGateFieldErrors] = useState<Record<string, string> | undefined>();
  const [processError, setProcessError] = useState<string | null>(null);
  const hydrated = useRef(false);
  const startedTracked = useRef(false);

  // Resume in-progress work after an accidental refresh. Never resumes past
  // "gate" — a completed result isn't something to silently re-render from
  // a stale cache.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = loadStored();
    if (stored && (stored.step === "context" || stored.step === "question")) {
      setContext(stored.context);
      setRawAnswers(stored.rawAnswers);
      setQuestionIndex(stored.questionIndex);
      setStep(stored.step);
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (step === "context" || step === "question") {
      saveStored({ context, rawAnswers, questionIndex, step });
    }
  }, [step, context, rawAnswers, questionIndex]);

  const currentQuestion = QUESTIONS[questionIndex];

  const handleStart = () => {
    if (!startedTracked.current) {
      startedTracked.current = true;
      trackEvent("assessment_started");
    }
    setStep("context");
  };

  const handleContextContinue = (ctx: AssessmentContext) => {
    setContext(ctx);
    setQuestionIndex(0);
    setStep("question");
    trackEvent("assessment_context_completed", { stage: ctx.stage });
  };

  const runProcessing = async (finalAnswers: Record<string, string>) => {
    setStep("processing");
    setProcessError(null);
    const attribution = collectAttribution();

    try {
      const res = await fetch("/api/assessment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          rawAnswers: finalAnswers,
          attribution,
          website: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProcessError(data.error || "Something went wrong. Please try again.");
        setStep("process_error");
        return;
      }

      setAssessmentId(data.assessmentId);
      setResultData({
        ideaName: context.ideaName || null,
        ideaDescription: context.ideaDescription || null,
        stage: context.stage,
        firstName: null,
        overallScore: data.scoring.overallScore,
        overallBand: data.scoring.overallBand,
        dimensionScores: data.scoring.dimensionScores,
        criticalFlags: data.scoring.criticalFlags,
        contradictions: data.scoring.contradictions,
        evidenceDebt: data.scoring.evidenceDebt,
        strongestSignal: data.scoring.strongestSignal,
        biggestExposure: data.scoring.biggestExposure,
        priorityInvestigation: data.scoring.priorityInvestigation,
        materialNegativeEvidence: data.scoring.materialNegativeEvidence,
        generatedAssessmentText: data.generatedAssessmentText,
        generationStatus: data.generationStatus,
      });
      trackEvent("assessment_completed", { overall_score: data.scoring.overallScore });
      setStep("gate");
    } catch {
      setProcessError("Something went wrong. Please check your connection and try again.");
      setStep("process_error");
    }
  };

  const handleAnswer = (value: string) => {
    const updated = { ...rawAnswers, [currentQuestion.code]: value };
    setRawAnswers(updated);
    trackEvent("assessment_question_completed", { question: currentQuestion.code });

    const advance = () => {
      if (questionIndex + 1 < QUESTIONS.length) {
        setQuestionIndex((i) => i + 1);
      } else {
        runProcessing(updated);
      }
    };

    if (currentQuestion.kind === "closed") {
      setTimeout(advance, 220);
    } else {
      advance();
    }
  };

  const handleBack = () => {
    if (step === "question" && questionIndex === 0) {
      setStep("context");
    } else if (step === "question") {
      setQuestionIndex((i) => Math.max(0, i - 1));
    }
  };

  const handleGateSubmit = async (values: LeadGateSubmission) => {
    if (!assessmentId) return;
    setGateSubmitting(true);
    setGateError(undefined);
    setGateFieldErrors(undefined);

    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          firstName: values.firstName,
          email: values.email,
          ongoingContentOptIn: values.ongoingContentOptIn,
          website: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setGateFieldErrors(data.fieldErrors);
        setGateError(data.error || "Something went wrong. Please try again.");
        setGateSubmitting(false);
        return;
      }

      setResultData(data.result);
      trackEvent("assessment_lead_captured");
      clearStored();
      setStep("result");
    } catch {
      setGateError("Something went wrong. Please check your connection and try again.");
    } finally {
      setGateSubmitting(false);
    }
  };

  useEffect(() => {
    if (step === "result") trackEvent("assessment_result_viewed");
  }, [step]);

  const progressTotal = QUESTIONS.length;

  return (
    <div className="w-full">
      {step === "intro" && <IntroScreen onStart={handleStart} />}
      {step === "context" && <ContextScreen initial={context} onContinue={handleContextContinue} />}
      {step === "question" && (
        <QuestionScreen
          key={currentQuestion.code}
          question={currentQuestion}
          index={questionIndex}
          total={progressTotal}
          value={rawAnswers[currentQuestion.code] || ""}
          onAnswer={handleAnswer}
          onBack={handleBack}
        />
      )}
      {step === "processing" && <ProcessingScreen />}
      {step === "process_error" && (
        <div className="max-w-xl">
          <p className="text-base text-[#6b1f1f] mb-6">{processError}</p>
          <button
            onClick={() => runProcessing(rawAnswers)}
            className="text-sm font-semibold tracking-widest uppercase text-white bg-[#6b1f1f] px-8 py-4"
          >
            Try again →
          </button>
        </div>
      )}
      {step === "gate" && (
        <LeadGateForm onSubmit={handleGateSubmit} submitting={gateSubmitting} errorMessage={gateError} fieldErrors={gateFieldErrors} />
      )}
      {step === "result" && resultData && (
        <ResultView data={resultData} assessmentId={assessmentId ?? undefined} paidCtaUrl={paidCtaUrl} />
      )}
    </div>
  );
}
