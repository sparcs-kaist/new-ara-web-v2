"use client";

import React, { HTMLAttributes } from "react";

type ButtonProps = {
  type?: "highlighted" | "outlined" | "disabled" | "default";
  children?: React.ReactNode;
  onClick?: (() => void) | ((e: React.MouseEvent<HTMLDivElement>) => void);
} & HTMLAttributes<HTMLDivElement>;

// Tailwind 클래스 묶음 객체
const buttonTypeClasses: Record<
  NonNullable<ButtonProps["type"]>,
  string
> = {
    highlighted:
        "inline-flex justify-center items-center px-[20px] py-[8px] rounded-[8px] leading-5 text-white bg-[#ED3A3A] hover:bg-[#C62626] cursor-pointer h-fit",
    default:
        "inline-flex justify-center items-center px-[20px] py-[8px] rounded-[8px] leading-5 text-black bg-[#E9E9E9] hover:bg-[#B5B5B5] cursor-pointer h-fit",
    outlined:
        "inline-flex justify-center items-center px-[20px] py-[8px] rounded-[8px] text-base leading-5 text-[#ED3A3A] bg-white hover:bg-[#FAFAFA] border border-[#ED3A3A] cursor-pointer h-fit",
    disabled:
        "inline-flex justify-center items-center px-[20px] py-[8px] rounded-[8px] text-base leading-5 text-gray-300 bg-gray-50 border border-gray-300 cursor-not-allowed h-fit",
};

const ButtonWithTextInner = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="whitespace-nowrap inline-flex justify-center items-center gap-1 w-full text-xs font-normal">
    {children}
  </div>
);

const ButtonWithChildren = ({ children }: { children: React.ReactNode }) => (
  <ButtonWithTextInner>{children}</ButtonWithTextInner>
);

const Button = ({
  type = "highlighted",
  children,
  ...divProps
}: ButtonProps) => {
  const baseClasses = buttonTypeClasses[type];

  const ButtonContent = () => {
    return <ButtonWithChildren>{children}</ButtonWithChildren>;
  };

  return (
    <div
      {...divProps}
      className={`${baseClasses} ${divProps.className || ""}`}
      onClick={type === "disabled" ? undefined : divProps.onClick}
    >
      <ButtonContent />
    </div>
  );
};

export default Button;
