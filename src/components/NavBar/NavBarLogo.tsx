import Link from "next/link";

export default function NavBarLogo() {
  return (
    <div 
      className="flex-shrink-0"
      style={{marginLeft: "clamp(20px, 5vw, 150px)", width: "64px", height: "35px" }}>
      <Link href="/">
        <img src="/ServiceAra.png" className="h-full w-full" alt="Service Ara Logo" />
      </Link>
    </div>
  );
}