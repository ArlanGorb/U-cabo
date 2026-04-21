import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { type Product, formatPrice } from '@/lib/utils';

export function ProductCard({ product }: { product: any }) {
  // Mendukung gambar dari database Supabase (image_url) atau data statis (image)
  const imageUrl = product.image_url || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

  return (
    <Link to={`/product/${product.id}`} className="group block h-full">
      <Card className="h-full flex flex-col p-2 overflow-hidden border border-slate-200/60 bg-slate-50/80 rounded-3xl transition-all duration-300 hover:bg-slate-100/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/40">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay gradient untuk teks yang lebih jelas */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

          <Badge
            className="absolute left-2.5 top-2.5 bg-white/90 text-slate-800 backdrop-blur-md shadow-sm border-0 font-bold px-2.5 py-0.5 rounded-lg"
            variant="outline"
          >
            {product.condition}
          </Badge>
        </div>
        
        <div className="flex flex-col flex-1 px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <Badge
              className="bg-slate-200/80 text-slate-600 border-0 text-[10px] font-bold px-2 py-0.5 rounded-md"
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
               <span className="text-xs font-semibold text-slate-400">Harga</span>
               <span className="text-lg font-black tracking-tight text-slate-900">
                 {formatPrice(product.price)}
               </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
