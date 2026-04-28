import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { type Product, formatPrice } from '@/lib/utils';

export function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const imageUrl = product.image_url || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <Link to={`/product/${product.id}`} className="group block h-full" style={{ perspective: '1200px' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      >
        <Card className="card-3d h-full flex flex-col p-2.5 overflow-hidden rounded-3xl inner-light">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white border border-slate-100/80 shadow-3d">
            <motion.img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
              whileHover={{ scale: 1.12 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            />
            {/* 3D depth overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-white/10 opacity-0 transition-all duration-500 group-hover:opacity-100"></div>
            
            {/* 3D floating badge */}
            <Badge
              className="absolute left-3 top-3 glass-3d text-slate-800 font-bold px-3 py-1 rounded-xl text-[11px] shadow-3d"
              variant="outline"
            >
              {product.condition}
            </Badge>
          </div>
          
          <div className="flex flex-col flex-1 px-3 pt-3.5 pb-2" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center justify-between mb-2">
              <Badge
                className="bg-gradient-to-r from-slate-100 to-slate-200/80 text-slate-600 border-0 text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm"
                variant="secondary"
              >
                {product.category}
              </Badge>
            </div>
            <h3 className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-slate-800 transition-colors group-hover:text-primary">
              {product.name}
            </h3>
            <div className="mt-3 flex items-end justify-between gap-1">
              <div className="flex flex-col">
                 <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Harga</span>
                 <span className="text-lg font-black tracking-tight text-slate-900">
                   {formatPrice(product.price)}
                 </span>
              </div>
              <motion.div 
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-3d btn-3d btn-ripple"
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
