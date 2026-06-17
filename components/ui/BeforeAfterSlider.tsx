"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  /** Initial split percentage 0-100 (default: 50) */
  initialPosition?: number;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  initialPosition = 50,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const isDragging = useRef(false);

  const getPositionFromEvent = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      setPosition((x / rect.width) * 100);
    },
    []
  );

  // Mouse events
  const onMouseDown = () => { isDragging.current = true; };
  const onMouseMove = useCallback(
    (e: MouseEvent) => { if (isDragging.current) getPositionFromEvent(e.clientX); },
    [getPositionFromEvent]
  );
  const onMouseUp = () => { isDragging.current = false; };

  // Touch events
  const onTouchStart = () => { isDragging.current = true; };
  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging.current && e.touches[0])
        getPositionFromEvent(e.touches[0].clientX);
    },
    [getPositionFromEvent]
  );
  const onTouchEnd = () => { isDragging.current = false; };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onMouseMove, onTouchMove]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-xl select-none cursor-ew-resize ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* AFTER image — full width underneath */}
      <div className="absolute inset-0">
        <Image
          src={afterSrc}
          alt={afterAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* BEFORE image — clipped on the left */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <div className="absolute inset-0" style={{ width: `${100 / (position / 100)}%` }}>
          <Image
            src={beforeSrc}
            alt={beforeAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            draggable={false}
          />
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        style={{ left: `calc(${position}% - 1px)` }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.35)] border-2 border-white/80 cursor-ew-resize hover:scale-110 transition-transform duration-150"
        style={{ left: `${position}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <ChevronsLeftRight className="w-5 h-5 text-primary" strokeWidth={2.5} />
      </div>

      {/* BEFORE badge */}
      <span
        className="absolute top-4 left-4 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/20 pointer-events-none"
        style={{ opacity: position > 12 ? 1 : 0, transition: "opacity 0.2s" }}
      >
        Before
      </span>

      {/* AFTER badge */}
      <span
        className="absolute top-4 right-4 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-primary/80 text-white backdrop-blur-sm border border-white/20 pointer-events-none"
        style={{ opacity: position < 88 ? 1 : 0, transition: "opacity 0.2s" }}
      >
        After
      </span>


      
    </div>

    
  );
};
