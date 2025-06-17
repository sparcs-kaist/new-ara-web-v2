// app/otherServices/page.tsx (혹은 components/OtherServices.tsx)
import ServiceBox from "@/components/UserMenu/ServiceBox";

const services = [
  { label: "OTL", href: "https://otl.kaist.ac.kr/" },
  { label: "Taxi", href: "https://taxi.sparcs.org/home" },
  { label: "메일", href: "https://kaist.gov-dooray.com" },
  { label: "KLMS", href: "https://klms.kaist.ac.kr" },
  { label: "Portal", href: "https://portal.kaist.ac.kr" },
  { label: "URS", href: "https://erp.kaist.ac.kr" },
  { label: "KDS", href: "https://kds.kaist.ac.kr" },
  { label: "냐옹", href: "https://naver.com" },
];

export default function OtherServices() {
  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-4 w-fit mx-auto">
      {services.map((service) => (
        <ServiceBox key={service.href} label={service.label} href={service.href} />
      ))}
    </div>
  );
}
