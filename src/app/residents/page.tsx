export default async function ResidentsPage() {
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/residents`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return (
        <main className="p-6 text-red-600">
          Failed to load residents. Status: {res.status}
        </main>
      );
    }

    const json = await res.json();

    // 🧠 Deep inspection — log what we got
    console.log("API response:", json);

    // ✅ Guarantee an array, no matter what shape the response is
    const residents =
      (json &&
        typeof json === "object" &&
        Array.isArray(json.data) &&
        json.data) ||
      (Array.isArray(json) && json) ||
      [];

    // 👇 Debug fallback (optional for local testing)
    if (!Array.isArray(residents)) {
      console.error("Residents is not an array:", residents);
    }

    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Residents</h1>

        {residents.length === 0 ? (
          <p>No residents found.</p>
        ) : (
          <ul>
            {Array.isArray(residents) &&
              residents.map((r, i) => (
                <li key={r?.id || i} className="border-b py-2">
                  <strong>{r?.name ?? "Unknown"}</strong> —{" "}
                  {r?.unit ?? "N/A"} — {r?.phone ?? ""}
                </li>
              ))}
          </ul>
        )}
      </main>
    );
  } catch (err) {
    console.error("[ResidentsPage] error:", err);
    return (
      <main className="p-6 text-red-600">
        Unexpected error: {String(err)}
      </main>
    );
  }
}