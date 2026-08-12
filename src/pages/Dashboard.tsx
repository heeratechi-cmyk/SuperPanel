import React, { useEffect, useState } from 'react';
import WelcomeCard from '../components/WelcomeCard';
import WalletCard from '../components/WalletCard';
import { 
  ShoppingBag, 
  PhoneCall, 
  Share2, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { fetchServices, fetchUserOrders } from '../services/db';
import { ServiceItem, OrderRecord, ServiceCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (route: string) => void;
  onSelectService: (service: ServiceItem) => void;
}

export default function Dashboard({ onNavigate, onSelectService }: DashboardProps) {
  const { userProfile } = useAuth();
  const [featuredServices, setFeaturedServices] = useState<ServiceItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    setLoading(true);
    const services = await fetchServices();
    setFeaturedServices(services.slice(0, 4));

    if (userProfile) {
      const orders = await fetchUserOrders(userProfile.uid);
      setRecentOrders(orders.slice(0, 3));
    }
    setLoading(false);
  };

  const categories: Array<{
    name: ServiceCategory;
    tagline: string;
    icon: any;
    color: string;
  }> = [
    {
      name: 'Buy Account',
      tagline: 'WhatsApp · Instagram · TikTok verified & aged accounts',
      icon: ShoppingBag,
      color: 'from-purple-600 to-indigo-600',
    },
    {
      name: 'Virtual Numbers',
      tagline: 'Instant SMS OTP verification lines for 50+ services',
      icon: PhoneCall,
      color: 'from-violet-600 to-purple-600',
    },
    {
      name: 'Social Media Services',
      tagline: 'High quality Followers, Likes, Views & Watch Time',
      icon: Share2,
      color: 'from-indigo-600 to-purple-700',
    },
    {
      name: 'Digital Services',
      tagline: 'Canva Pro, ChatGPT Plus, Netflix & Premium passes',
      icon: Sparkles,
      color: 'from-fuchsia-600 to-purple-600',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome Card */}
      <WelcomeCard />

      {/* 2. Wallet Card */}
      <WalletCard onNavigate={onNavigate} />

      {/* 3. Choose a Service Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>Choose a Service</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Tap a category to browse available services
            </p>
          </div>
          <button
            onClick={() => onNavigate('/services')}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => onNavigate(`/services/${encodeURIComponent(cat.name)}`)}
                className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-3xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(79,70,229,0.15)] mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {cat.tagline}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-all">
                  <span>Explore category</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Top Trending Services */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Popular Services</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-3xl bg-slate-900/40 border border-slate-800/60 p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-0.5 rounded-full">
                    {service.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Stock: {service.stock}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-3 group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {service.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Price</span>
                  <div className="text-sm font-black text-white font-mono">
                    Rs. {service.price.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => onSelectService(service)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent Orders Preview */}
      {recentOrders.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Recent Orders</span>
            </h2>
            <button
              onClick={() => onNavigate('/orders')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentOrders.map((ord) => (
              <div
                key={ord.orderId}
                onClick={() => onNavigate(`/order/${ord.orderId}`)}
                className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      #{ord.orderId}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {ord.serviceName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-white font-mono">
                    Rs. {ord.totalAmount.toLocaleString()}
                  </div>
                  <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 capitalize ${
                    ord.status === 'completed'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                      : ord.status === 'processing'
                      ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                  }`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* System Status Footer Bar */}
      <div className="border border-slate-800/60 bg-slate-950/40 p-4 sm:p-6 rounded-3xl flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4 mt-8 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="font-semibold text-slate-300">SuperPanel Direct Cloud API: Operational</span>
        </div>
        <div className="flex items-center gap-6 text-[11px]">
          <span>Firebase DB Connected</span>
          <span>Instant OTP Engine Active</span>
          <span>24/7 Climax Support</span>
        </div>
      </div>
    </div>
  );
}
