"use client";
import React, { useState } from 'react';
import { Search, ShoppingCart, Heart, Clock, User } from 'lucide-react';
import Image from 'next/image';
import offer from "@/public/home_1.jpg" 

export default function FoodOrderPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartCount, setCartCount] = useState(0);
    const [isVegOnly, setIsVegOnly] = useState(false);


  const categories = [
    { name: 'Burgers', emoji: '🍔' },
    { name: 'Noodles', emoji: '🍜' },
    { name: 'Pizza', emoji: '🍕' },
    { name: 'Tacos', emoji: '🌮' }
  ];

  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden font-[inter]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
       <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>
      <div className="absolute bottom-70 left-70 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-8 pb-4 ">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 ">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-lg"><User/></span>
            </div>
            <span className="text-gray-700 font-medium text-xl ml-2 ">Hey Foodie!!</span>
          </div>
          <button className="relative" onClick={addToCart}>
            <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
              <ShoppingCart  fill="#f1623a" className="w-5 h-5 text-primary" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <h1 className="text-2xl font-bold text-primary-text/80 mb-6 leading-tight ">
          What are you going<br />to eat today??
        </h1>

        <div className="relative mb-6 flex flex-row gap-2 items-center">
          <input
            type="text"
            placeholder={`Search here..`}
            className="w-full bg-white/80 backdrop-blur-sm rounded-2xl px-12 py-4 pr-14 text-gray-700 placeholder-gray-400 outline-none shadow-sm hover:outline-1 focus:outline-1"
          />
          <button className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-primary border-white" />
          </button>
          {/* veg classifier */}
           <button
      onClick={() => setIsVegOnly(!isVegOnly)}
      className={`w-10 h-13 rounded-xl flex flex-col items-center justify-between gap-0.5 px-2 pt-2 pb-1 transition-colors bg-gray-400`
      }
    >
      <span className="text-xs text-white font-bold">{(isVegOnly)?"ON":"OFF"}</span>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
        isVegOnly ? 'border-white bg-green-800' : 'border-white bg-primary'
      }`}>
      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
        isVegOnly ? 'border-white bg-green-800' : 'border-white bg-primary'
      }`}>
        <div className="w-[6px] h-[6px] rounded-full bg-white"></div></div>
      </div>
    </button>
        </div>

        {/* Discount Banner */}
        <div className="rounded-3xl p-6 mb-6 relative overflow-hidden shadow-md font-[inter]">
          <Image src={offer} fill  className='' alt='trending'/>
          <div className="relative flex justify-center pl-16 flex-col z-10 text-left ">
            <h2 className="text-gray-900 font-bold text-2xl ">Get</h2>
            <h2 className="text-primary font-bold text-3xl italic">50% off</h2>
            <p className="text-gray-900 text-sm font-medium">on first meal</p>
          </div>
        </div>

        {/* Categories Section */}
      <div className="mb-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold text-gray-900"> Categories</h3>
    <button className="text-primary font-medium text-sm">See More</button>
  </div>

  <div className="flex justify-between gap-3">
    {categories.map((cat, idx) => (
      <button
        key={idx}
        onClick={() => setSelectedCategory(cat.name)}
        className="flex flex-col items-center"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 transition-all ${
          selectedCategory === cat.name
            ? 'bg-primary shadow-lg scale-110'
            : 'bg-white shadow-sm'
        }`}>
          {cat.emoji}
        </div>
        <span className={`text-xs font-medium ${
          selectedCategory === cat.name ? 'text-primary' : 'text-gray-700'
        }`}>
          {cat.name}
        </span>
      </button>
    ))}
  </div>
</div>

        {/* Food Items Preview */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <div className="relative mb-3">
              <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl flex items-center justify-center">
                <span className="text-6xl">🍔</span>
              </div>
              <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Heart className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">Cheese Burger</h4>
            <p className="text-xs text-gray-500 mb-2">Double patty with cheese</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">$12.99</span>
              <button 
                onClick={addToCart}
                className="w-8 h-8 bg-pink-300 rounded-full flex items-center justify-center hover:bg-pink-400 transition-colors"
              >
                <span className="text-white text-xl leading-none">+</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm">
            <div className="relative mb-3">
              <div className="w-full h-32 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center">
                <span className="text-6xl">🌭</span>
              </div>
              <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Heart className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">Classic Hotdog</h4>
            <p className="text-xs text-gray-500 mb-2">With special sauce</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">$8.99</span>
              <button 
                onClick={addToCart}
                className="w-8 h-8 bg-pink-300 rounded-full flex items-center justify-center hover:bg-pink-400 transition-colors"
              >
                <span className="text-white text-xl leading-none">+</span>
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}