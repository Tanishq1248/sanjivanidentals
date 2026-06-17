import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  hoverEffect = true,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl p-6 shadow-level-1 border border-outline-variant/10 ${
        hoverEffect ? "hover:shadow-level-2 hover:-translate-y-1 transition-all duration-300" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
