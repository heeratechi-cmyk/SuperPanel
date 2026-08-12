import React, { useState, useEffect } from 'react';
import { ServiceItem, ServiceCategory } from '../types';
import { fetchServices } from '../services/db';
import { Search, Filter, ShoppingBag, PhoneCall, Share2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface ServicesProps {
  initialCategory?: string;
  onSelectService: (service: ServiceItem) => void;
}

export default function Services({ initialCategory, onSelectService }: ServicesProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under1000' | '1000to5000' | 'above5000'>('all');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const data = await fetchServices();
    setServices(data);
    setLoading(false);
  };

  const categories = [
    'All',
    'Buy Account',
    'Virtual Numbers',
    'Social Media Services',
    'Digital Services',
  ];

  const filteredServices = services.filter((item) => {
    // Category match
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    // Search query match (debounced or live)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    // Price filter
    if (priceFilter === 'under1000' && item.price >= 1000) return false;
    if (priceFilter === '1000to5000' && (item.price < 1000 || item.price > 5000)) return false;
    if (priceFilter === 'above5000' && item.price <= 5000) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Digital Services Catalog</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Explore legitimate digital accounts, virtual numbers, and social media enhancement packages
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts, virtual numbers, or digital services..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 shadow-xl backdrop-blur-xl transition-all"
          />
        </div>

        {/* Category Pills Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 border border-purple-400/40'
                  : 'bg-slate-900/80 text-gray-400 hover:text-white border border-purple-900/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Price Range Filter */}
        <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
          <span className="flex items-center gap-1 font-semibold text-gray-300">
            <Filter className="w-3.5 h-3.5 text-purple-400" /> Price:
          </span>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as any)}
            className="bg-slate-900 border border-purple-900/40 text-gray-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Prices</option>
            <option value="under1000">Under Rs. 1,000</option>
            <option value="1000to5000">Rs. 1,000 - Rs. 5,000</option>
            <option value="above5000">Above Rs. 5,000</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-16 text-center text-purple-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-medium">Loading catalog from SuperPanel Cloud...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-purple-900/30">
          <AlertCircle className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">No Services Found</h3>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your search query or selecting a different category filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setPriceFilter('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 text-purple-300 text-xs font-semibold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-purple-900/40 p-6 backdrop-blur-xl hover:border-purple-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-950/40 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-700/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {service.category}
                  </span>
                  <span className={`text-[11px] font-mono ${service.stock > 0 ? 'text-purple-400 font-semibold' : 'text-red-400'}`}>
                    {service.stock > 0 ? `In Stock (${service.stock})` : 'Out of Stock'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-900/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                    Price
                  </span>
                  <div className="text-lg font-extrabold text-white font-mono">
                    Rs. {service.price.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => onSelectService(service)}
                  disabled={service.stock <= 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/50 disabled:opacity-40"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
