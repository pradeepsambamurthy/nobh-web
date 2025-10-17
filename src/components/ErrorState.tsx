// src/components/ErrorState.tsx
type ErrorStateProps = {
  error: unknown;
  what?: string;
};

export default function ErrorState({ error, what = "data" }: ErrorStateProps) {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message)
      : "Something went wrong";

  return (
    <p className="p-6 text-red-600">
      Failed to load {what}. {message}
    </p>
  );
}