import React from 'react';

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-12 gap-2 w-full p-5 bg-gray-50">
      <div className="col-span-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800 mb-1">65</div>
          <p className="text-xs text-gray-500 font-medium">Total Orders</p>
          <span className="text-xs text-green-600 font-semibold">↑ 10.6%</span>
        </div>
      </div>
      
      <div className="col-span-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800 mb-1">98</div>
          <p className="text-xs text-gray-500 font-medium">Total Delivered</p>
          <span className="text-xs text-green-600 font-semibold">↑ 20.2%</span>
        </div>
      </div>
      
      <div className="col-span-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800 mb-1">17</div>
          <p className="text-xs text-gray-500 font-medium">Total Canceled</p>
          <span className="text-xs text-red-600 font-semibold">↓ 10.6%</span>
        </div>
      </div>
      
      <div className="col-span-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800 mb-1">9K</div>
          <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
          <span className="text-xs text-green-600 font-semibold">↑ 60.5%</span>
        </div>
      </div>
      
      <div className="col-span-4 row-span-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Chart Order</h3>
            <button className="text-xs bg-gray-900 text-white px-3 py-1 rounded-full">Daily</button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800 mb-2">834</div>
              <p className="text-xs text-gray-500">Weekly total orders</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-span-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
        <div className="h-full">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Active Value</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="62.8" transform="rotate(-90 50 50)"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="125.6" transform="rotate(0 50 50)"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">75%</div>
                    <p className="text-xs text-gray-500">Avg</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Total Order</span>
                </div>
                <span className="font-semibold text-gray-800">51%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span className="text-gray-600">Running Order</span>
                </div>
                <span className="font-semibold text-gray-800">24%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-gray-600">Customer Growth</span>
                </div>
                <span className="font-semibold text-gray-800">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">Total Revenue</span>
                </div>
                <span className="font-semibold text-gray-800">86%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}