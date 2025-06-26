import Image from 'next/image';
import React from 'react';

interface MakerCardProps {
  title: string;
  subtitle: string;
  position?: string;
  active?: boolean;
  launched?: string;
  isProject?: boolean;
  onClick?: () => void;
}

const MakerCard: React.FC<MakerCardProps> = ({
  title,
  subtitle,
  position,
  active = false,
  launched,
  isProject = false,
  onClick
}) => {
  if (isProject) {
    return (
      <div 
        className={`
          w-[220px] h-[80px] rounded-[10px] bg-white flex flex-col items-center justify-center
          relative hover:shadow-lg transition-shadow duration-300 ease-in-out
          ${active ? 'shadow-md' : 'shadow-sm'}
          cursor-pointer
          sm:w-[110px]
        `}
        onClick={onClick}
      >
        <span className="text-[15px] font-bold leading-[1.47] sm:text-[12px] sm:text-center">
          {title}
        </span>
        <span className="mt-[12px] text-[9px] font-medium leading-[1.44] text-gray-400">
          {subtitle}
        </span>
        {launched && (
          <span className="text-[9px] font-medium leading-[1.44] text-gray-400">
            launched at {launched}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`
      w-[280px] h-[120px] py-0 px-[36px] rounded-[10px] shadow-md bg-white
      flex flex-row items-center justify-between
      hover:shadow-lg transition-shadow duration-300 ease-in-out
      sm:w-[120px] sm:flex-col sm:justify-center
    `}>
      <div className="flex flex-col items-start sm:items-center">
        <span className="text-[20px] font-bold leading-[1.5] sm:text-[14px] sm:text-center">
          {title}
        </span>
        <div className="mt-[4px] flex flex-row items-start">
          <div className="w-[13px] h-[20px] overflow-hidden">
            <Image 
              src="SparcsLogo.svg" 
              alt="Sparcs Logo" 
              width={70} 
              height={20}
              className="w-[70px] max-w-none filter-[invert(63%)_sepia(71%)_saturate(514%)_hue-rotate(352deg)_brightness(97%)_contrast(91%)]"
            />
          </div>
          <span className="text-[13px] font-extrabold leading-[1.5] font-['Raleway'] text-[#eba12a]">
            {subtitle}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium leading-[1.5] text-gray-400 sm:mt-[5px] sm:text-center">
        {position}
      </span>
    </div>
  );
};

export default MakerCard;