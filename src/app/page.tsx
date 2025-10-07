export default function Home() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">NoBrokerHood Plus — Admin</h1>
        <p className="text-muted-foreground">Starter running. Next: add UI components.</p>
        <a href="/residents" className="underline">Go to Residents (we’ll add later)</a>
      </div>
    </main>
  );
}