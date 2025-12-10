"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";


export default function OnboardingSlides() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [direction, setDirection] = useState(1);

  
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");

    if (hasSeenOnboarding === "true") {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setDirection(1);
        setCurrentSlide(currentSlide + 1);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentSlide]);

  const slides = [
    {
      image: "/onboardingslide1.png",
      title: "Order whatever you want to eat",
      description:
        "Order delicious food from your favorite restaurants with just a few taps",
    },
    {
      image: "/onboardingslide2.png",
      title: "Choose according to your preferred time slot",
      description:
        "Select your preferred pickup or delivery time slot that fits your schedule",
    },
    {
      image: "/onboardingslide3.png",
      title: "Let's end your cravings",
      description:
        "Get your food delivered fresh and hot right without any hassle",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    router.push("/signup");
    console.log("Navigate to login");
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      handleNext();
    }
    if (touchStart - touchEnd < -75) {
      handlePrev();
    }
  };

  const slideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
    }),
    center: { x: 0 },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
    }),
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto bg-orange-50 overflow-hidden">
      <div className="absolute inset-0">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.4, ease: "easeInOut" },
            }}
            className="absolute inset-0"
          >
            <img
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip Button */}
      {currentSlide < slides.length - 1 && (
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={handleSkip}
            className="text-white hover:text-gray-200 flex items-center font-medium px-4 py-2 rounded-lg transition-all"
          >
            Skip
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div
        className="relative z-10 min-h-screen flex flex-col justify-end"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-t-[2rem] pt-8 px-8 pb-4 shadow-2xl flex flex-col justify-center items-center" style={{ minHeight: "20rem" }}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
            {slides[currentSlide].title}
          </h1>

          <p className="text-lg text-gray-600 text-center mb-8">
            {slides[currentSlide].description}
          </p>

          <div className="flex gap-[2px] justify-center mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
                className={`h-1 transition-all duration-300 ${
                  index === currentSlide
                    ? "w-16 bg-orange-500"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {currentSlide === slides.length - 1 ? (
            <button onClick={handleGetStarted} className="bg-orange-500 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg">
              Get Started
              <ChevronRight size={20} />
            </button>
          ) : (
            <div className="pb-2"></div>
          )}
        </div>
      </div>
    </div>
  );
}
