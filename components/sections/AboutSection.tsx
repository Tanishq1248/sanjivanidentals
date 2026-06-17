import React from "react";
import Image from "next/image";
import { Award, Users, Calendar, Heart, ShieldCheck, HeartHandshake, Cpu, Award as Trophy } from "lucide-react";
import { Card } from "../ui/Card";

export const AboutSection: React.FC = () => {
  const stats = [
    {
      icon: <Users className="w-10 h-10 text-primary-container mb-3" />,
      value: "10,000+",
      label: "Happy Patients",
    },
    {
      icon: <Calendar className="w-10 h-10 text-primary-container mb-3" />,
      value: "15+",
      label: "Years Excellence",
    },
    {
      icon: <Heart className="w-10 h-10 text-primary-container mb-3" />,
      value: "98%",
      label: "Patient Satisfaction",
    },
    {
      icon: <Trophy className="w-10 h-10 text-primary-container mb-3" />,
      value: "50+",
      label: "Modern Treatments",
    },
  ];

  const values = [
    {
      icon: <HeartHandshake className="w-8 h-8 text-primary-container" />,
      title: "Patient First",
      description: "Your comfort and needs dictate our approach. We listen, explain clearly, and prioritize gentle, anxiety-free experiences.",
    },
    {
      icon: <Cpu className="w-8 h-8 text-primary-container" />,
      title: "Advanced Tech",
      description: "We invest heavily in the latest dental technology to ensure precise diagnostics, faster recovery, and superior outcomes.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary-container" />,
      title: "Clinical Excellence",
      description: "Compromise is not in our vocabulary. From routine cleanings to complex procedures, we adhere to the highest clinical standards.",
    },
  ];

  return (
    <section className="py-20" id="about">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* Doctor Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20 items-center">
          {/* Doctor Image */}
          <div className="md:col-span-5 rounded-xl overflow-hidden shadow-level-1 bg-surface-container-lowest h-[400px] relative">
            <Image
              alt="Dr. Anya Sharma"
              fill
              className="object-cover object-center"
              src="https://lh3.googleusercontent.com/aida/AP1WRLsuPHdERu4ervQ8YoyI2Fc4jec6pdmw_Mai4SlVJ8ZHoc20S2IC9iyEQEhFAV_vnSnAI5_ZxGeg8_XUbAJqi6IwsgA6kdZJjCQjZ3avoEgikDGiq3bcRK-jei3-5Jur8PY3okS_i6q8kmOgsq4FgnSdFNL-O4DqkW5GXb-pTZ5tX6QWKI_CAK7tGW0EOvn01UxAKBZL5R1ZrnIdCnAcomSL7jbbCuszIvu8fWl5zlkL4du7Hbw0uJfRZg"
            />
          </div>

          {/* Doctor Bio */}
          <div className="md:col-span-7 bg-surface-container-lowest rounded-xl p-8 shadow-level-1 border border-outline-variant/10 flex flex-col justify-center h-full">
            <div className="inline-flex items-center gap-1.5 bg-secondary-container text-primary-container px-4 py-1.5 rounded-full text-xs font-semibold w-fit mb-6">
              <Award className="w-4 h-4" />
              <span>Clinical Director</span>
            </div>
            <h2 className="text-3xl font-bold text-on-surface mb-2 tracking-tight">
              Dr. Anya Sharma, DDS
            </h2>
            <p className="text-primary font-semibold mb-6 text-sm">
              Over 15 Years of Clinical Excellence
            </p>
            <div className="w-12 h-1 bg-primary-container rounded-full mb-6"></div>
            <p className="text-on-surface-variant text-base leading-relaxed mb-6">
              Dr. Sharma founded DentaPure with a singular vision: to merge state-of-the-art dental technology with compassionate, patient-first care. Her approach ensures that every treatment plan is tailored not just for clinical perfection, but for the individual&apos;s comfort and long-term well-being.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-20">
          {stats.map((stat, index) => (
            <Card key={index} hoverEffect={true} className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest">
              <div className="flex items-center justify-center">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-on-surface-variant font-medium">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>

        {/* Core Values Section */}
        <div>
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">
              Our Core Values
            </h2>
            <p className="text-on-surface-variant leading-relaxed text-sm">
              The principles that guide our practice and ensure you receive the highest standard of care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="flex flex-col p-8 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">
                  {value.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
