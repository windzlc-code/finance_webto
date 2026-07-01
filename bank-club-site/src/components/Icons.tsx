export function Icon({ name }: { name: "person" | "home" | "building" | "search" | "phone" | "mail" | "arrow" | "shield" | "globe" }) {
  if (name === "person") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 31c7 0 12-5 12-12S39 7 32 7 20 12 20 19s5 12 12 12Z" />
        <path d="M12 57c2-13 10-20 20-20s18 7 20 20" />
        <circle cx="48" cy="42" r="9" />
        <path d="M48 36v12M44 40h7c3 0 3 5 0 5h-7" />
      </svg>
    );
  }
  if (name === "home") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M9 31 32 11l23 20" />
        <path d="M16 29v26h32V29" />
        <path d="M26 55V39h12v16" />
        <path d="M44 16v10" />
      </svg>
    );
  }
  if (name === "building") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M15 55V15l22-6v46" />
        <path d="M37 25h12v30" />
        <path d="M22 22h6M22 32h6M22 42h6M43 34h3M43 43h3" />
        <path d="M9 55h46" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z" />
      </svg>
    );
  }
  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16v14H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }
  if (name === "globe") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c3 3 4.5 6 4.5 9S15 18 12 21" />
        <path d="M12 3c-3 3-4.5 6-4.5 9S9 18 12 21" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
