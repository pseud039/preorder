"use client";
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function OnboardingSlides() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const slides = [
    {
      image: "/onboardingslide1.png",
      title: "Order whatever you want to eat",
      description: "Order delicious food from your favorite restaurants with just a few taps",
    },
    {
      image: "/onboardingslide2.png",
      title: "Choose according to your preferred time slot",
      description: "Select your preferred pickup or delivery time slot that fits your schedule",
    },
    {
      image: "/onboardingslide3.png",
      title: "Let's end your cravings",
      description: "Get your food delivered fresh and hot right without any hassle",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    // window.location.href = '/(auth)/login';
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

  return (
    <div className="relative min-h-screen max-w-md  mx-auto bg-orange-50 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 transition-opacity duration-700">
        <img
          src={slides[currentSlide].image}
          alt={slides[currentSlide].title}
          className="w-full h-full object-cover"
        />
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
        className="relative z-10 min-h-screen flex flex-col justify-end "
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Text Content */}
        <div className="bg-secondary h-80 backdrop-blur-md rounded-t-4xl pt-8 px-8 pb-4 shadow-2xl flex flex-col justify-center items-center">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text mb-4 text-center">
            {slides[currentSlide].title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 text-center mb-8">
            {slides[currentSlide].description}
          </p>

          {/* Progress Dots */}
          <div className="flex gap-[2px] justify-center mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 w-8 transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-16 bg-orange-500'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Button */}
          {currentSlide === slides.length - 1 ?(
            <button
              onClick={handleGetStarted}
            //   className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            className='btn-primary'
            >
              Get Started
              <ChevronRight size={20} />
            </button>
          ):(<div className='pb-2'></div>)}
        </div>
      </div>
    </div>
  );
}