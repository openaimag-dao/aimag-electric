"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0, background: "#0e1622", color: "#f3f5f8" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#ffb300", fontWeight: 600, margin: 0 }}>500</p>
          <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0" }}>Критическая ошибка</h1>
          <p style={{ color: "#9ba7b4", maxWidth: 420 }}>
            Приложение столкнулось с непредвиденной ошибкой. Попробуйте перезагрузить.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: "1.5rem", background: "#ffb300", color: "#0e1622", border: "none", padding: "0.7rem 1.4rem", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
          >
            Перезагрузить
          </button>
        </div>
      </body>
    </html>
  );
}
