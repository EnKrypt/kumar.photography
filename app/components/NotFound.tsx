import { Link } from "react-router";

export function NotFound() {
  return (
    <main className="message-page">
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to the gallery</Link>
      </p>
    </main>
  );
}
