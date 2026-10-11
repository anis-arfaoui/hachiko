interface WalaaLogoProps {
  className?: string;
}

export const WalaaLogo = ({ className = "w-8 h-8" }: WalaaLogoProps) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" fill="var(--color-primary)" r="6" />
    <circle cx="22" cy="10" fill="var(--color-primary)" opacity="0.8" r="6" />
    <circle cx="10" cy="22" fill="var(--color-primary)" opacity="0.9" r="6" />
    <circle cx="22" cy="22" fill="var(--color-primary)" r="6" />
    <circle cx="16" cy="16" fill="var(--color-primary-foreground)" r="3" />
  </svg>
);
