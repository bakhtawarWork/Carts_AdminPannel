import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({ size = 48, className, priority = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
