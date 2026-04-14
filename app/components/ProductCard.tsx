'use client';

import { ExternalLink, MapPin, Package, Star } from 'lucide-react';
import { Product } from '@/app/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-slate-700">
      {/* Product Image */}
      <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-12 h-12" />
          </div>
        )}
        
        {/* Rating Badge */}
        {product.rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium text-white">{product.rating}</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm">
          {product.title}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{product.price}</span>
          {product.minOrder && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{product.minOrder}</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
          {product.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{product.location}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[60%]">
            {product.supplier}
          </div>

          {product.url ? (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium transition-colors"
            >
              View
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs text-gray-400">1688</span>
          )}
        </div>
      </div>
    </div>
  );
}
