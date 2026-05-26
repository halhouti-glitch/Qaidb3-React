import type { ReactNode } from 'react';

type HeaderProps = {
  left?: ReactNode;
  right?: ReactNode;
  eyebrow?: string;
  title?: string;
};

export function Header({ left, right, eyebrow, title }: HeaderProps) {
  return (
    <div className="app-header">
      <div className="header-side" style={{ minWidth: 40, justifyContent: 'flex-start' }}>
        {left}
      </div>
      <div className="title-block">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <h1>{title}</h1>}
      </div>
      <div className="header-side" style={{ minWidth: 40, justifyContent: 'flex-end' }}>
        {right}
      </div>
    </div>
  );
}
