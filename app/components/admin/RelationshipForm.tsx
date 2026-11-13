"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";

export default function RelationshipForm({ action, success, children, className, reset = false }: {
  action: (data: FormData) => Promise<string | null>;
  success: string;
  children: ReactNode;
  className?: string;
  reset?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ message: string; error: boolean }>();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form, (event.nativeEvent as SubmitEvent).submitter);
    setFeedback(undefined);
    startTransition(async () => {
      try {
        const error = await action(data);
        if (!error && reset) form.reset();
        setFeedback({ message: error ?? success, error: Boolean(error) });
      } catch {
        setFeedback({ message: "The change could not be confirmed. Check your session and try again.", error: true });
      }
    });
  }
  return <form onSubmit={submit} aria-busy={pending}>
    <fieldset disabled={pending} className={className}>{children}</fieldset>
    <p role={feedback?.error ? "alert" : "status"} className="mt-1 text-xs text-[#6b1f1f]">
      {pending ? "Saving…" : feedback?.message}
    </p>
  </form>;
}
