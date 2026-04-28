import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/u-cabo-logo.png';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500); // Beri waktu animasi fade out selesai
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          {/* Ornamen Background Halus */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

          <div className="relative flex flex-col items-center">
            {/* Logo Image Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-4"
            >
              <img src={logo} alt="U-Cabo Logo" className="h-24 w-24 md:h-32 md:w-32 object-contain drop-shadow-xl" />
            </motion.div>

            {/* Brand Name Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.2,
                duration: 0.8, 
                ease: [0, 0.71, 0.2, 1.01],
                scale: {
                  type: "spring",
                  damping: 12,
                  stiffness: 100,
                  restDelta: 0.001
                }
              }}
              className="mb-6"
            >
              <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter uppercase">
                U-Cabo
              </h1>
            </motion.div>

            {/* Tagline Animation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="h-1 w-12 bg-primary/20 rounded-full"></div>
              <p className="text-sm md:text-base font-black text-slate-400 uppercase tracking-[0.3em]">
                Praktis <span className="text-primary/30 mx-2">•</span> Aman <span className="text-primary/30 mx-2">•</span> Ekonomis
              </p>
            </motion.div>
          </div>

          {/* Loading Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-16 flex flex-col items-center gap-3"
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1, 
                    delay: i * 0.2 
                  }}
                  className="h-2 w-2 bg-primary rounded-full"
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Memuat Pengalaman Kampus</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
