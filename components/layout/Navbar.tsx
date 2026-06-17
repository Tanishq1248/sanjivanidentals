"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/Button";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      const id = href.replace("/#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm"
          : "bg-surface/80 backdrop-blur-md"
      }`}
    >
      <div className="flex justify-between items-center h-20 px-6 max-w-[1200px] mx-auto">
        {/* Brand */}
        <Link href="/" className="font-semibold text-2xl text-primary flex items-center gap-2 active:scale-95 transition-transform">
          <Image
            src="/sanjivanilogo.png"
            alt="Sanjivani Dental Clinic Logo"
            width={36}
            height={36}
            className="w-12 h-10 object-contain"
            priority
          />
          <span>Sanjivani Dental CLinic</span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className={`${
              pathname === "/"
                ? "text-primary font-semibold text-sm relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                : "text-secondary hover:text-primary transition-all duration-300 font-medium text-sm"
            }`}
          >
            Home
          </Link>
          <Link
            href="/services"
            className={`${
              pathname === "/services"
                ? "text-primary font-semibold text-sm relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                : "text-secondary hover:text-primary transition-all duration-300 font-medium text-sm"
            }`}
          >
            Services
          </Link>
          <Link
            href="/about"
            className={`${
              pathname === "/about"
                ? "text-primary font-semibold text-sm relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                : "text-secondary hover:text-primary transition-all duration-300 font-medium text-sm"
            }`}
          >
            About
          </Link>
          <Link
            href="/gallery"
            className={`${
              pathname === "/gallery"
                ? "text-primary font-semibold text-sm relative after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary"
                : "text-secondary hover:text-primary transition-all duration-300 font-medium text-sm"
            }`}
          >
            Gallery
          </Link>
          <Link
            href="/#patient-info"
            onClick={(e) => handleNavClick(e, "/#patient-info")}
            className="text-secondary hover:text-primary transition-all duration-300 font-medium text-sm"
          >
            Patient Info
          </Link>
        </nav>

        {/* Trailing Action */}
        <div className="hidden md:block">
          <Link href="/book">
            <Button variant="primary" size="md">
              Book Now
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-primary p-2 rounded-lg hover:bg-surface-variant transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-surface border-t border-outline-variant/20 absolute w-full left-0 top-20 shadow-level-2 transition-all duration-300">
          <div className="flex flex-col p-6 gap-3">
            <Link
              onClick={() => setIsOpen(false)}
              className={`font-medium text-sm py-3 border-b border-outline-variant/10 ${
                pathname === "/" ? "text-primary font-semibold" : "text-secondary hover:text-primary"
              }`}
              href="/"
            >
              Home
            </Link>
            <Link
              onClick={() => setIsOpen(false)}
              className={`font-medium text-sm py-3 border-b border-outline-variant/10 ${
                pathname === "/services" ? "text-primary font-semibold" : "text-secondary hover:text-primary"
              }`}
              href="/services"
            >
              Services
            </Link>
            <Link
              onClick={() => setIsOpen(false)}
              className={`font-medium text-sm py-3 border-b border-outline-variant/10 ${
                pathname === "/about" ? "text-primary font-semibold" : "text-secondary hover:text-primary"
              }`}
              href="/about"
            >
              About
            </Link>
            <Link
              onClick={() => setIsOpen(false)}
              className={`font-medium text-sm py-3 border-b border-outline-variant/10 ${
                pathname === "/gallery" ? "text-primary font-semibold" : "text-secondary hover:text-primary"
              }`}
              href="/gallery"
            >
              Gallery
            </Link>
            <Link
              onClick={(e) => {
                setIsOpen(false);
                handleNavClick(e, "/#patient-info");
              }}
              className="text-secondary hover:text-primary transition-all duration-300 font-medium text-sm py-3"
              href="/#patient-info"
            >
              Patient Info
            </Link>
            <Link href="/book" onClick={() => setIsOpen(false)} className="w-full">
              <Button
                variant="primary"
                size="md"
                className="w-full"
              >
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
