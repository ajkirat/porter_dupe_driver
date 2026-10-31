"use client";

// Shows what went wrong instead of a blank "page couldn't load", so problems can be reported and fixed.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-3 p-6">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="break-words rounded-xl bg-red-50 p-3 text-sm text-red-800">{error.message || "Unknown error"}</p>
      {error.digest && <p className="text-xs text-stone-500">Code: {error.digest}</p>}
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
