import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 active:scale-[0.98] cursor-pointer";
  
  const variants = {
    primary: "bg-primary-container text-white hover:bg-primary shadow-level-1",
    secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary/20",
    outline: "bg-transparent border border-outline-variant hover:border-primary/50 text-on-surface-variant hover:text-primary",
    text: "bg-transparent text-primary hover:bg-secondary-container/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
