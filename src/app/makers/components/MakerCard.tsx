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
  // PM인지 확인
  const isPM = position?.includes('Project Manager');

  if (isProject) {
    return (
      <div 
        className={`
          w-full max-w-[200px] h-[100px] rounded-[10px] bg-white flex flex-col items-center justify-center
          relative hover:shadow-lg transition-shadow duration-300 ease-in-out
          ${active ? 'shadow-md' : 'shadow-sm'}
          cursor-pointer
          sm:w-full sm:max-w-none
        `}
        onClick={onClick}
      >
        <span className="text-[16px] font-bold leading-[1.47] sm:text-[14px] sm:text-center px-2">
          {title}
        </span>
        <span className="mt-[12px] text-[10px] font-medium leading-[1.44] text-gray-400">
          {subtitle}
        </span>
        {launched && (
          <span className="text-[10px] font-medium leading-[1.44] text-gray-400">
            launched at {launched}
          </span>
        )}
      </div>
    );
  }

  // PM 카드 레이아웃
  if (isPM) {
    return (
      <div className={`
        w-full max-w-[220px] h-[140px] py-0 px-[30px] rounded-[10px] 
        bg-gradient-to-br from-[#fff3d1] to-white
        shadow-sm
        flex flex-row items-center justify-between
        hover:shadow-md transition-all duration-1000 ease-in-out
        relative overflow-visible
        sm:w-full sm:max-w-none
      `}>
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden rounded-[10px]">
          <div 
            style={{
              position: 'absolute',
              top: '0',
              width: '80%',
              height: '200%',
              background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0))',
              opacity: '0.7',
              transform: 'skewX(45deg)',
              animation: 'pmShine 1.5s ease-in-out infinite',
              boxShadow: '0 0 30px 10px rgba(255,255,255,0.5)',
            }}
          />
        </div>
        <div className="flex flex-col items-start z-[2] max-w-[55%]">
          <span className="text-[20px] font-bold leading-[1.3] text-[#333] truncate w-full">
            {title}
          </span>
          <div className="mt-[4px] flex flex-row items-center">
            <div className="w-[13px] h-[20px] overflow-hidden mr-1 flex-shrink-0">
              <Image 
                src="/SparcsLogo.svg" 
                alt="Sparcs Logo" 
                width={70} 
                height={20}
                className="w-[70px] max-w-none [filter:invert(74%)_sepia(56%)_saturate(1094%)_hue-rotate(347deg)_brightness(97%)_contrast(92%)]"
              />
            </div>
            <span className="text-[14px] font-extrabold leading-[1.5] font-['Raleway'] text-[#eba12a] truncate">
              {subtitle}
            </span>
          </div>
        </div>
        
        <div className="z-[2] self-center flex-shrink-0 flex flex-col items-end">
          <span className="text-[12px] font-semibold leading-[1.4] text-[#eba12a] mb-1">
            {position?.match(/\d{4}/)?.[0] || ''}
          </span>
          <span className="text-[12px] font-bold leading-[1.4] text-[#eba12a] text-right">
            Project Manager
          </span>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes pmShine {
              0% {
                left: -150%;
              }
              100% {
                left: 150%;
              }
            }
            
            @keyframes borderRotate {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div className={`
      w-full max-w-[220px] h-[140px] py-0 px-[30px] rounded-[10px] shadow-sm bg-white
      flex flex-row items-center justify-between
      hover:shadow-md transition-shadow duration-300 ease-in-out
      sm:w-full sm:max-w-none
    `}>
      <div className="flex flex-col items-start max-w-[65%]">
        <span className="text-[18px] font-bold leading-[1.5] truncate w-full">
          {title}
        </span>
        <div className="mt-[4px] flex flex-row items-center">
          <div className="w-[13px] h-[20px] overflow-hidden mr-1 flex-shrink-0">
            <Image 
              src="/SparcsLogo.svg" 
              alt="Sparcs Logo" 
              width={70} 
              height={20}
              className="w-[70px] max-w-none [filter:invert(74%)_sepia(56%)_saturate(1094%)_hue-rotate(347deg)_brightness(97%)_contrast(92%)]"
            />
          </div>
          <span className="text-[13px] font-extrabold leading-[1.5] font-['Raleway'] text-[#eba12a] truncate">
            {subtitle}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium leading-[1.5] text-gray-400 text-right flex-shrink-0">
        {position}
      </span>
    </div>
  );
};

export default MakerCard;