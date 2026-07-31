import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Package } from 'lucide-react';

interface MapaEntregaProps {
  driverLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
}

export const MapaEntrega: React.FC<MapaEntregaProps> = ({ driverLocation, destinationLocation }) => {
  const [progress, setProgress] = useState(0);

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Simple interpolation for the visual simulation
  // We'll use a fixed grid instead of actual lat/lng
  const startPoint = { x: 20, y: 80 }; // bottom left
  const endPoint = { x: 80, y: 20 }; // top right

  const currentX = startPoint.x + ((endPoint.x - startPoint.x) * (progress / 100));
  const currentY = startPoint.y + ((endPoint.y - startPoint.y) * (progress / 100));

  return (
    <div className="w-full h-full bg-[#1a1b1e] relative overflow-hidden flex items-center justify-center">
      {/* Grid Background to simulate map streets */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #4a4b50 1px, transparent 1px),
            linear-gradient(to bottom, #4a4b50 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Fake Map Elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="absolute top-10 left-10 px-4 py-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-xl z-20">
        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Status da Entrega</div>
        <div className="text-white font-medium flex items-center">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2" />
          Em trânsito
        </div>
        <div className="text-xs text-zinc-500 mt-1">Previsão: 12 min</div>
      </div>

      {/* SVG Path */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
        <path 
          d={`M ${startPoint.x}% ${startPoint.y}% Q 50% 50% ${endPoint.x}% ${endPoint.y}%`}
          fill="none" 
          stroke="#3f3f46" 
          strokeWidth="4"
          strokeDasharray="8 8"
        />
        <path 
          d={`M ${startPoint.x}% ${startPoint.y}% Q 50% 50% ${currentX}% ${currentY}%`}
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="4"
        />
      </svg>

      {/* Destination Marker */}
      <div 
        className="absolute z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-full"
        style={{ left: `${endPoint.x}%`, top: `${endPoint.y}%` }}
      >
        <div className="bg-rose-500 p-2 rounded-full shadow-lg shadow-rose-500/20 mb-1">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div className="w-2 h-2 bg-rose-500 rounded-full" />
      </div>

      {/* Origin Marker */}
      <div 
        className="absolute z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-full"
        style={{ left: `${startPoint.x}%`, top: `${startPoint.y}%` }}
      >
        <div className="bg-zinc-800 p-2 rounded-full border border-zinc-700 shadow-lg mb-1">
          <MapPin className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="w-2 h-2 bg-zinc-600 rounded-full" />
      </div>

      {/* Driver Marker */}
      <div 
        className="absolute z-30 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-linear"
        style={{ left: `${currentX}%`, top: `${currentY}%` }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30" />
          <div className="bg-blue-600 p-2.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] border-2 border-white">
            <Navigation className="w-5 h-5 text-white transform rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
};
