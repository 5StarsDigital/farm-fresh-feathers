import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Egg, Wallet, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
  farmId: string;
  onCollectEgg: (quantity: number) => void;
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
  farmId,
  onCollectEgg,
  onSellEggs
}: AnimatedFarmProps) {
  const [animatedChickens, setAnimatedChickens] = useState<Chicken[]>([]);
  const [floatingEggs, setFloatingEggs] = useState<Array<{
    id: string;
    x: number;
    y: number;
    opacity: number;
  }>>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [uncollectedEggs, setUncollectedEggs] = useState(0);
  const farmRef = useRef<HTMLDivElement>(null);

  // Load uncollected eggs from database on mount
  useEffect(() => {
    const loadUncollectedEggs = async () => {
      if (!farmId) return;
      try {
        const {
          data,
          error
        } = await supabase.from('eggs_inventory').select('uncollected_eggs').eq('farm_id', farmId).single();
        if (error && error.code !== 'PGRST116') {
          // Column might not exist yet, ignore the error
          if (error.message?.includes('uncollected_eggs')) {
            console.log('uncollected_eggs column not found, using default value');
            return;
          }
          throw error;
        }
        setUncollectedEggs((data as any)?.uncollected_eggs || 0);
      } catch (error) {
        console.error('Error loading uncollected eggs:', error);
      }
    };
    loadUncollectedEggs();
  }, [farmId]);

  // Update database when uncollected eggs change
  const updateUncollectedEggs = async (newCount: number, options?: {
    newTotalEggs?: number;
    retry?: number;
  }): Promise<boolean> => {
    if (!farmId) return false;
    const retries = options?.retry ?? 1;
    const payload: {
      farm_id: string;
      uncollected_eggs: number;
      total_eggs?: number;
    } = {
      farm_id: farmId,
      uncollected_eggs: newCount
    };
    if (typeof options?.newTotalEggs === 'number') {
      payload.total_eggs = options.newTotalEggs;
    }
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const {
          error
        } = await supabase.from('eggs_inventory').upsert(payload, {
          onConflict: 'farm_id'
        });
        if (error) throw error;

        // Keep local state in sync if needed (UI was already optimistically updated)
        setUncollectedEggs(newCount);
        return true;
      } catch (err) {
        console.error(`Error updating uncollected eggs (attempt ${attempt + 1}/${retries + 1}):`, err);
        if (attempt === retries) {
          return false;
        }
        await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
      }
    }
    return false;
  };

  // Initialize animated chickens
  useEffect(() => {
    const initialChickens: Chicken[] = [];
    chickens.forEach(chicken => {
      for (let i = 0; i < Math.min(chicken.quantity, 8); i++) {
        initialChickens.push({
          id: `${chicken.id}-${i}`,
          x: Math.random() * 60 + 20,
          // 20-80% of container width (within fence area)
          y: Math.random() * 30 + 50,
          // 50-80% of container height (within fence area)
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
        let newChicken = {
          ...chicken
        };
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
            newChicken.x = Math.max(20, newChicken.x - Math.random() * 8); // Stay within fence
          } else {
            newChicken.x = Math.min(80, newChicken.x + Math.random() * 8); // Stay within fence
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
      setFloatingEggs(prev => prev.map(egg => ({
        ...egg,
        y: egg.y - 1,
        opacity: egg.opacity - 0.02
      })).filter(egg => egg.opacity > 0));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Call server to calculate egg production when component loads
  useEffect(() => {
    const calculateEggProduction = async () => {
      if (!farmId) return;
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('calculate-egg-production');
        if (error) {
          console.error('Error calculating egg production:', error);
          return;
        }
        if (data.success && data.totalNewEggs > 0) {
          console.log(`Server calculated ${data.totalNewEggs} new eggs`);
          // Use callback form to add new eggs to current value
          setUncollectedEggs(prev => prev + data.totalNewEggs);
          if (soundEnabled && data.totalNewEggs > 0) playEggSound();
        }
      } catch (error) {
        console.error('Error calling egg production function:', error);
      }
    };
    calculateEggProduction();

    // Set up periodic calculation (every 5 minutes)
    const interval = setInterval(calculateEggProduction, 300000);
    return () => clearInterval(interval);
  }, [farmId, soundEnabled]);
  const handleCollectEgg = async () => {
    if (uncollectedEggs > 0) {
      if (soundEnabled) playCollectSound();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);

      // Add all uncollected eggs to total eggs in one operation
      const eggsToAdd = uncollectedEggs;
      const newTotalEggs = totalEggs + eggsToAdd;
      onCollectEgg(eggsToAdd);

      // Optimistic UI: reset local state immediately for responsiveness
      setUncollectedEggs(0);

      // Persist to DB with retry and include new totalEggs to keep data consistent
      const ok = await updateUncollectedEggs(0, {
        newTotalEggs,
        retry: 1
      });
      if (!ok) {
        console.warn('Cập nhật cơ sở dữ liệu thất bại. Thực hiện rollback UI.');
        setUncollectedEggs(eggsToAdd);
        // Optionally rollback parent total eggs if supported: onCollectEgg(-eggsToAdd)
      }
    }
  };
  const handleSellEggs = () => {
    if (soundEnabled) playCollectSound();
    onSellEggs(Math.min(10, totalEggs));
  };
  return <div className="space-y-6">
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
            <div className="relative text-white p-4 rounded-xl border-4 border-amber-700 shadow-lg overflow-hidden" style={{
            backgroundImage: `url(${cardBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
              <div className="absolute inset-0 bg-amber-500/80"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-2">
                  <Wallet className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold drop-shadow-lg">Số dư tài khoản</p>
                <p className="text-lg font-bold drop-shadow-lg">{balance.toLocaleString()} VND</p>
              </div>
            </div>
            
            <div className="relative text-white p-4 rounded-xl border-4 border-orange-700 shadow-lg overflow-hidden" style={{
            backgroundImage: `url(${cardBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
              <div className="absolute inset-0 bg-orange-500/80"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-2">
                  <Egg className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold drop-shadow-lg">Số trứng hiện có</p>
                <p className="text-lg font-bold drop-shadow-lg">{totalEggs} quả</p>
              </div>
            </div>
            
            <div className="relative text-white p-4 rounded-xl border-4 border-red-700 shadow-lg overflow-hidden" style={{
            backgroundImage: `url(${cardBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
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


      {/* Main Farm Area - Split View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-96">
            {/* Left Side - Chicken Coop Animation */}
            <div ref={farmRef} className="relative overflow-hidden border-4 border-amber-700 rounded-l-lg" style={{
            backgroundColor: '#87CEEB',
            backgroundImage: `linear-gradient(to bottom, rgba(135,206,235,1) 0%, rgba(135,206,235,0.85) 30%, rgba(135,206,235,0.5) 55%, rgba(135,206,235,0) 70%), url('/lovable-uploads/1716f21c-78c8-44e9-91c0-4767ae9b1e6c.png')`,
            backgroundSize: 'cover, contain',
            backgroundPosition: 'center top, center bottom',
            backgroundRepeat: 'no-repeat, no-repeat'
          }}>
            
            {/* Wooden Fence */}
            <div className="absolute inset-4">
              {/* Top fence */}
              
              
              
              {/* Bottom fence */}
              
              
              
              {/* Left fence */}
              
              
              
              {/* Right fence */}
              
              
              
              {/* Vertical fence posts */}
              
              
              
              
            </div>
            
            {/* Chicken Coop House */}
            <div className="absolute bottom-6 right-6">
              <div className="relative">
                {/* House base */}
                
                {/* Roof */}
                
                {/* Door */}
                
                {/* Nest area */}
                
              </div>
            </div>
            
            {/* Moving Clouds */}
            <div className="absolute top-2 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-4 animate-[slide-in-right_20s_linear_infinite] opacity-70">
                <div className="w-16 h-8 bg-white rounded-full shadow-sm"></div>
                <div className="w-12 h-6 bg-white rounded-full shadow-sm -mt-3 ml-2"></div>
              </div>
              <div className="absolute top-12 animate-[slide-in-right_25s_linear_infinite_2s] opacity-60">
                <div className="w-20 h-10 bg-white rounded-full shadow-sm"></div>
                <div className="w-14 h-7 bg-white rounded-full shadow-sm -mt-4 ml-3"></div>
              </div>
              <div className="absolute top-6 animate-[slide-in-right_30s_linear_infinite_5s] opacity-50">
                <div className="w-14 h-6 bg-white rounded-full shadow-sm"></div>
                <div className="w-10 h-5 bg-white rounded-full shadow-sm -mt-2 ml-2"></div>
              </div>
            </div>

            {/* TV Monitor */}
            <div className="absolute top-4 left-4 bg-orange-600 p-2 rounded-lg border-4 border-orange-800 shadow-lg z-10">
              <div className="relative w-24 h-16 bg-gray-800 rounded border-2 border-gray-600">
                <div className="absolute top-1 left-1 w-4 h-2 bg-red-500 text-white text-xs text-center rounded">
                  LIVE
                </div>
                <div className="flex items-center justify-center h-full">
                  <span className="text-white text-2xl">🐔</span>
                </div>
              </div>
            </div>

            {/* Egg Basket in top right */}
            <div className="absolute top-4 right-4 bg-amber-600 p-2 rounded-lg border-4 border-amber-800 shadow-lg z-10">
              <div className="relative w-24 h-16 bg-amber-200 rounded border-2 border-amber-400">
                <div className="absolute top-1 left-1 text-xs text-amber-800 font-bold">
                  🧺 Giỏ trứng
                </div>
                <div className="flex items-center justify-center h-full flex-wrap gap-1 pt-3">
                  {Array.from({
                    length: Math.min(uncollectedEggs, 3)
                  }, (_, i) => <span key={i} className="text-sm animate-bounce" style={{
                    animationDelay: `${i * 0.1}s`
                  }}>
                      🥚
                    </span>)}
                  {uncollectedEggs > 3 && <span className="text-xs text-amber-800 font-bold">+{uncollectedEggs - 3}</span>}
                </div>
              </div>
            </div>

            {/* Animated Chickens */}
            {animatedChickens.map(chicken => <div key={chicken.id} className={cn("absolute transition-all duration-1000 ease-in-out cursor-pointer transform hover:scale-110", chicken.animationState === 'jumping' && "animate-bounce", chicken.animationState === 'crowing' && "animate-pulse scale-110", chicken.direction === 'left' && "scale-x-[-1]")} style={{
              left: `${chicken.x}%`,
              top: `${chicken.y}%`,
              transform: `translate(-50%, -50%) ${chicken.direction === 'left' ? 'scaleX(-1)' : ''}`
            }} onClick={() => soundEnabled && playChickenSound()}>
                <div className="relative">
                  <span className="text-4xl drop-shadow-lg">
                    {chicken.animationState === 'crowing' ? '🐓' : '🐔'}
                  </span>
                  {chicken.isLayingEgg && <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 animate-bounce">
                      <span className="text-xl">🥚</span>
                    </div>}
                  {chicken.animationState === 'crowing' && <div className="absolute -top-2 -right-2 animate-ping">
                      <span className="text-sm">♪</span>
                    </div>}
                </div>
              </div>)}

            {/* Floating Eggs */}
            {floatingEggs.map(egg => <div key={egg.id} className="absolute pointer-events-none" style={{
              left: `${egg.x}%`,
              top: `${egg.y}%`,
              opacity: egg.opacity,
              transform: 'translate(-50%, -50%)'
            }}>
                <span className="text-2xl">🥚</span>
              </div>)}

            {/* Celebration Effect */}
            {showCelebration && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl animate-bounce">🎉</div>
                <div className="absolute text-4xl animate-ping">✨</div>
              </div>}

            {/* Bottom info bar */}
            <div className="absolute bottom-2 left-4 text-sm text-green-800 font-semibold bg-white/80 px-3 py-1 rounded-full z-10">
              Số trứng gà chưa thu hoạch: {uncollectedEggs}
            </div>
            </div>

            {/* Right Side - Live Camera */}
            <div className="relative bg-gray-100 flex flex-col">
              <div className="bg-red-600 text-white text-center py-2 font-bold text-lg">
                CAMERA TRỰC TIẾP
              </div>
              <div className="flex-1 relative">
                <iframe width="100%" height="100%" src="https://rtsp.me/embed/NFG5zGhs/" frameBorder="0" allowFullScreen className="absolute inset-0" title="Camera trực tiếp - Khu vực chính">
                </iframe>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={handleCollectEgg} size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg">
          <Egg className="mr-2 h-6 w-6" />
          Thu hoạch trứng
        </Button>
        
        <Button onClick={handleSellEggs} size="lg" variant="outline" disabled={totalEggs === 0} className="border-2 border-green-500 text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl text-lg font-bold shadow-lg">
          💰 Bán 10 trứng
        </Button>

        <Button onClick={() => setSoundEnabled(!soundEnabled)} size="lg" variant="outline" className="border-2 border-blue-500 text-blue-700 hover:bg-blue-50 px-4 py-4 rounded-xl shadow-lg">
          {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </Button>
      </div>
    </div>;
}