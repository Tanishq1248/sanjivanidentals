import React from "react";
import { HeroSection } from "../../components/sections/HeroSection";
import { ServicesSection } from "../../components/sections/ServicesSection";
import { GalleryPreview } from "../../components/sections/GalleryPreview";
import { AboutSection } from "../../components/sections/AboutSection";
import { TestimonialsSection } from "../../components/sections/TestimonialsSection";

export const revalidate = 3600; // Revalidate at most once per hour

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <GalleryPreview />
      <AboutSection />
      <TestimonialsSection />
    </>
  );
}
