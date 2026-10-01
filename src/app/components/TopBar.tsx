import { href, type Route } from '../routes';

export function TopBar({ title, back }: { title: string; back?: Route }) {
  return (
    <header className="topbar">
      {back && <a className="back" href={href(back)} aria-label="Volver">←</a>}
      <h1>{title}</h1>
    </header>
  );
}
