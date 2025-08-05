import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Egg, Wallet, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import cardBackground from '@/assets/card-background.png';

interface Chicken {
  id: string;
  x: number;
  y: number;
  type: string;
  isLayingEgg: boolean;
  animationState: 'idle' | 'walking' | 'crowing' | 'jumping';
  direction: 'left' | 'right';
}

interface AnimatedFarmProps {
  farmName: string;
  balance: number;
  totalEggs: number;
  totalChickens: number;
  chickens: any[];
  onCollectEgg: () => void;
  onSellEggs: (quantity: number) => void;
}

// Sound effects using Web Audio API
const createBeepSound = (frequency: number, duration: number) => {
  if (typeof window === 'undefined') return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('Audio not supported');
  }
};

const playChickenSound = () => createBeepSound(800, 0.3);
const playEggSound = () => createBeepSound(600, 0.2);
const playCollectSound = () => createBeepSound(1200, 0.4);

export default function AnimatedFarm({
  farmName,
  balance,
  totalEggs,
  totalChickens,
  chickens,
  onCollectEgg,
  onSellEggs
}: AnimatedFarmProps) {
  const [animatedChickens, setAnimatedChickens] = useState<Chicken[]>([]);
  const [floatingEggs, setFloatingEggs] = useState<Array<{id: string, x: number, y: number, opacity: number}>>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const farmRef = useRef<HTMLDivElement>(null);

  // Initialize animated chickens
  useEffect(() => {
    const initialChickens: Chicken[] = [];
    chickens.forEach((chicken) => {
      for (let i = 0; i < Math.min(chicken.quantity, 8); i++) {
        initialChickens.push({
          id: `${chicken.id}-${i}`,
          x: Math.random() * 80 + 10, // 10-90% of container width
          y: Math.random() * 40 + 40, // 40-80% of container height  
          type: chicken.chicken_types.name,
          isLayingEgg: false,
          animationState: 'idle',
          direction: Math.random() > 0.5 ? 'left' : 'right'
        });
      }
    });
    setAnimatedChickens(initialChickens);
  }, [chickens]);

  // Chicken animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedChickens(prev => prev.map(chicken => {
        const action = Math.random();
        let newChicken = { ...chicken };

        if (action < 0.1) {
          // Crow
          newChicken.animationState = 'crowing';
          if (soundEnabled) playChickenSound();
        } else if (action < 0.2) {
          // Jump
          newChicken.animationState = 'jumping';
        } else if (action < 0.4) {
          // Walk
          newChicken.animationState = 'walking';
          newChicken.direction = Math.random() > 0.5 ? 'left' : 'right';
          
          if (newChicken.direction === 'left') {
            newChicken.x = Math.max(5, newChicken.x - Math.random() * 10);
          } else {
            newChicken.x = Math.min(95, newChicken.x + Math.random() * 10);
          }
        } else if (action < 0.45) {
          // Lay egg
          newChicken.isLayingEgg = true;
          newChicken.animationState = 'idle';
          
          if (soundEnabled) playEggSound();
          
          // Add floating egg
          setFloatingEggs(eggs => [...eggs, {
            id: `egg-${Date.now()}-${Math.random()}`,
            x: newChicken.x,
            y: newChicken.y + 10,
            opacity: 1
          }]);
          
          setTimeout(() => {
            newChicken.isLayingEgg = false;
          }, 1000);
        } else {
          // Idle
          newChicken.animationState = 'idle';
        }

        return newChicken;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Handle floating eggs animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingEggs(prev => 
        prev.map(egg => ({
          ...egg,
          y: egg.y - 1,
          opacity: egg.opacity - 0.02
        })).filter(egg => egg.opacity > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleCollectEgg = () => {
    if (soundEnabled) playCollectSound();
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1000);
    onCollectEgg();
  };

  const handleSellEggs = () => {
    if (soundEnabled) playCollectSound();
    onSellEggs(Math.min(10, totalEggs));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-green-400 via-blue-400 to-green-300 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        }}></div>
        
        <div className="relative text-center">
          <div className="bg-amber-600 text-white px-6 py-3 rounded-xl inline-block mb-4 border-4 border-amber-800 shadow-lg">
            <h1 className="text-2xl font-bold">🎉 Chào mừng: {farmName}</h1>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div 
              className="relative text-white p-4 rounded-xl border-4 border-amber-700 shadow-lg overflow-hidden"
              style={{
                backgroundImage: `url(${cardBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-amber-500/80"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-2">
                  <Wallet className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold drop-shadow-lg">Số dư tài khoản</p>
                <p className="text-lg font-bold drop-shadow-lg">{balance.toLocaleString()} VND</p>
              </div>
            </div>
            
            <div 
              className="relative text-white p-4 rounded-xl border-4 border-orange-700 shadow-lg overflow-hidden"
              style={{
                backgroundImage: `url(${cardBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-orange-500/80"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-2">
                  <Egg className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold drop-shadow-lg">Số trứng hiện có</p>
                <p className="text-lg font-bold drop-shadow-lg">{totalEggs} quả</p>
              </div>
            </div>
            
            <div 
              className="relative text-white p-4 rounded-xl border-4 border-red-700 shadow-lg overflow-hidden"
              style={{
                backgroundImage: `url(${cardBackground})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-red-500/80"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl">🐔</span>
                </div>
                <p className="text-sm font-semibold drop-shadow-lg">Tổng số gà</p>
                <p className="text-lg font-bold drop-shadow-lg">{totalChickens} con</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Monitoring Section */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📹</span>
            <h2 className="text-xl font-bold text-gray-800">Camera giám sát</h2>
          </div>
          <p className="text-gray-600 mb-6">Theo dõi trang trại của bạn trong thời gian thực</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera 1 */}
            <div className="space-y-3">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://rtsp.me/embed/bz78RBsB/" 
                  frameBorder="0" 
                  allowFullScreen
                  className="absolute inset-0"
                  title="Camera 1 - Khu vực chính"
                >
                </iframe>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-700">Camera 1 - Khu vực chính</h3>
              </div>
            </div>

            {/* Camera 2 */}
            <div className="space-y-3">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://rtsp.me/embed/QRKErRyA/" 
                  frameBorder="0" 
                  title="Camera 2 - Khu ăn uống" 
                  allowFullScreen
                  className="absolute inset-0"
                >
                </iframe>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-700">Camera 2 - Khu ăn uống</h3>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Tính năng camera:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Theo dõi hoạt động của gà 24/7</li>
              <li>• Cảnh báo khi có bất thường</li>
              <li>• Ghi lại các khoảnh khắc quan trọng</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Main Farm Area */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div 
            ref={farmRef}
            className="relative h-96 bg-gradient-to-b from-sky-300 via-sky-200 to-green-300 overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(to bottom, #87CEEB 0%, #98FB98 40%, #32CD32 100%),
                url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23228B22' fill-opacity='0.1'%3E%3Cpath d='M20 0h20v20H20z'/%3E%3C/g%3E%3C/svg%3E")
              `
            }}
          >
            {/* Background elements */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-green-400 to-transparent"></div>
            
            {/* Clouds */}
            <div className="absolute top-4 left-10 animate-pulse">
              <div className="w-16 h-8 bg-white rounded-full opacity-80"></div>
              <div className="w-12 h-6 bg-white rounded-full opacity-80 -mt-3 ml-2"></div>
            </div>
            <div className="absolute top-8 right-20 animate-pulse delay-1000">
              <div className="w-20 h-10 bg-white rounded-full opacity-70"></div>
              <div className="w-14 h-7 bg-white rounded-full opacity-70 -mt-4 ml-3"></div>
            </div>

            {/* Farm House */}
            <div className="absolute bottom-8 right-8">
              <div className="relative">
                {/* House base */}
                <div className="w-24 h-16 bg-red-600 rounded-t-lg border-2 border-red-800"></div>
                {/* Roof */}
                <div className="w-28 h-8 bg-amber-700 -mt-2 -ml-2 border-2 border-amber-900 relative">
                  <div className="absolute inset-0 bg-amber-700" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                </div>
                {/* Door */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-10 bg-amber-800 rounded-t-lg border border-amber-900"></div>
                {/* Eggs nest */}
                <div className="absolute -bottom-2 -right-4 w-8 h-4 bg-yellow-400 rounded-full">
                  <div className="absolute top-1 left-1 w-2 h-3 bg-white rounded-full"></div>
                  <div className="absolute top-1 right-1 w-2 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* TV Monitor */}
            <div className="absolute top-4 left-4 bg-orange-600 p-2 rounded-lg border-4 border-orange-800 shadow-lg">
              <div className="relative w-24 h-16 bg-gray-800 rounded border-2 border-gray-600">
                <div className="absolute top-1 left-1 w-4 h-2 bg-red-500 text-white text-xs text-center rounded">
                  LIVE
                </div>
                <div className="flex items-center justify-center h-full">
                  <span className="text-white text-2xl">🐔</span>
                </div>
              </div>
            </div>

            {/* Animated Chickens */}
            {animatedChickens.map((chicken) => (
              <div
                key={chicken.id}
                className={cn(
                  "absolute transition-all duration-1000 ease-in-out cursor-pointer transform hover:scale-110",
                  chicken.animationState === 'jumping' && "animate-bounce",
                  chicken.animationState === 'crowing' && "animate-pulse scale-110",
                  chicken.direction === 'left' && "scale-x-[-1]"
                )}
                style={{
                  left: `${chicken.x}%`,
                  top: `${chicken.y}%`,
                  transform: `translate(-50%, -50%) ${chicken.direction === 'left' ? 'scaleX(-1)' : ''}`
                }}
                onClick={() => soundEnabled && playChickenSound()}
              >
                <div className="relative">
                  <span className="text-4xl drop-shadow-lg">
                    {chicken.animationState === 'crowing' ? '🐓' : '🐔'}
                  </span>
                  {chicken.isLayingEgg && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 animate-bounce">
                      <span className="text-xl">🥚</span>
                    </div>
                  )}
                  {chicken.animationState === 'crowing' && (
                    <div className="absolute -top-2 -right-2 animate-ping">
                      <span className="text-sm">♪</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Floating Eggs */}
            {floatingEggs.map((egg) => (
              <div
                key={egg.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${egg.x}%`,
                  top: `${egg.y}%`,
                  opacity: egg.opacity,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <span className="text-2xl">🥚</span>
              </div>
            ))}

            {/* Celebration Effect */}
            {showCelebration && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl animate-bounce">🎉</div>
                <div className="absolute text-4xl animate-ping">✨</div>
              </div>
            )}

            {/* Bottom info bar */}
            <div className="absolute bottom-2 left-4 text-sm text-green-800 font-semibold bg-white/80 px-3 py-1 rounded-full">
              Các loại gà đang sở hữu
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={handleCollectEgg}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg"
        >
          <Egg className="mr-2 h-6 w-6" />
          Thu hoạch trứng
        </Button>
        
        <Button
          onClick={handleSellEggs}
          size="lg"
          variant="outline"
          disabled={totalEggs === 0}
          className="border-2 border-green-500 text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl text-lg font-bold shadow-lg"
        >
          💰 Bán 10 trứng
        </Button>

        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          size="lg"
          variant="outline"
          className="border-2 border-blue-500 text-blue-700 hover:bg-blue-50 px-4 py-4 rounded-xl shadow-lg"
        >
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}