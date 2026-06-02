import Link from "next/link";

// Geometric CryptId mark + wordmark. The SVG is the angular reference shape,
// recolored to ink. Swap the path later for a bespoke CryptId glyph.
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        fill="none"
        overflow="visible"
        viewBox="0 0 256 256"
        aria-hidden
      >
        <path
          d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z"
          fill="#192837"
        />
      </svg>
      <span className="font-heading text-lg tracking-tight text-ink">CryptId</span>
    </Link>
  );
}
