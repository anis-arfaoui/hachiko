import Image from "next/image";

interface WalaaLogoProps {
  className?: string;
  size?: number;
}

export const WalaaLogo = ({
  className = "h-8 w-8",
  size = 64,
}: WalaaLogoProps) => (
  <Image
    src="/walaa-logo.png"
    alt="Logo Walaa"
    width={size}
    height={size}
    className={`shrink-0 rounded-full object-cover ${className}`}
    priority
  />
);
