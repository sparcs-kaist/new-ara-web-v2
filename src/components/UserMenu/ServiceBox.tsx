interface ServiceBoxProps {
    label: string;
    href: string;
  }
  
  export default function ServiceBox({ label, href }: ServiceBoxProps) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-[70px] h-[70px] bg-gray-100 rounded-[8px] shadow-sm flex items-center justify-center hover:bg-gray-200"
      >
        <span className="text-sm text-center">{label}</span>
      </a>
    );
  }
  