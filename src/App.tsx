import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ParticleBackground from './components/ParticleBackground';
import ToastContainer from './components/Toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import ConfirmationModal from './components/ConfirmationModal';
import OtpVerification from './components/OtpVerification';

// Pages
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import AddFunds from './pages/AddFunds';
import Deposits from './pages/Deposits';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Transactions from './pages/Transactions';
import Support from './pages/Support';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

import { ServiceItem } from './types';
import { Loader2, ShieldAlert } from 'lucide-react';

function MainLayout() {
  const { currentUser, userProfile, pendingOtpEmail, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400 gap-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs font-mono tracking-widest uppercase font-bold text-indigo-300">
          Loading SuperPanel Engine...
        </p>
      </div>
    );
  }

  // Check pending OTP verification or unverified email first
  if (pendingOtpEmail || (userProfile && !userProfile.emailVerified)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white relative font-sans">
        <ParticleBackground />
        <ToastContainer />
        <main className="relative z-10 py-8">
          <OtpVerification />
        </main>
      </div>
    );
  }

  // Unauthenticated user route handling
  if (!currentUser) {
    if (currentRoute === '/signup') {
      return (
        <div className="min-h-screen bg-slate-950 text-white relative font-sans selection:bg-indigo-600 selection:text-white">
          <ParticleBackground />
          <ToastContainer />
          <main className="relative z-10 py-8">
            <Signup onNavigate={handleNavigate} />
          </main>
        </div>
      );
    }

    if (currentRoute === '/forgot-password') {
      return (
        <div className="min-h-screen bg-slate-950 text-white relative font-sans selection:bg-indigo-600 selection:text-white">
          <ParticleBackground />
          <ToastContainer />
          <main className="relative z-10 py-8">
            <ForgotPassword onNavigate={handleNavigate} />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white relative font-sans selection:bg-indigo-600 selection:text-white">
        <ParticleBackground />
        <ToastContainer />
        <main className="relative z-10 py-8">
          <Login onNavigate={handleNavigate} />
        </main>
      </div>
    );
  }

  // Render current view
  const renderView = () => {
    if (currentRoute === '/') {
      return <Dashboard onNavigate={handleNavigate} onSelectService={(s) => setSelectedService(s)} />;
    }

    if (currentRoute.startsWith('/services')) {
      const parts = currentRoute.split('/');
      const cat = parts[2] ? decodeURIComponent(parts[2]) : undefined;
      return <Services initialCategory={cat} onSelectService={(s) => setSelectedService(s)} />;
    }

    if (currentRoute === '/add-funds') {
      return <AddFunds onNavigate={handleNavigate} />;
    }

    if (currentRoute === '/deposits') {
      return <Deposits onNavigate={handleNavigate} />;
    }

    if (currentRoute === '/orders') {
      return <Orders onNavigate={handleNavigate} />;
    }

    if (currentRoute.startsWith('/order/')) {
      const orderId = currentRoute.replace('/order/', '');
      return <OrderDetails orderId={orderId} onNavigate={handleNavigate} />;
    }

    if (currentRoute === '/transactions') {
      return <Transactions />;
    }

    if (currentRoute === '/support') {
      return <Support onNavigate={handleNavigate} />;
    }

    if (currentRoute === '/support/create') {
      return <CreateTicket onNavigate={handleNavigate} />;
    }

    if (currentRoute.startsWith('/support/ticket/')) {
      const ticketId = currentRoute.replace('/support/ticket/', '');
      return <TicketDetails ticketId={ticketId} onNavigate={handleNavigate} />;
    }

    if (currentRoute === '/profile') {
      return <Profile />;
    }

    if (currentRoute === '/settings') {
      return <Settings />;
    }

    if (currentRoute === '/admin') {
      if (userProfile?.role !== 'admin') {
        return (
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-rose-900/50 text-center space-y-4 max-w-lg mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-rose-900/40 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Access Denied</h2>
            <p className="text-xs text-slate-400">
              You do not have administrative privileges to access the Admin Control Panel.
            </p>
            <button
              onClick={() => handleNavigate('/')}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Return to Client Dashboard
            </button>
          </div>
        );
      }
      return <AdminPanel />;
    }

    return <Dashboard onNavigate={handleNavigate} onSelectService={(s) => setSelectedService(s)} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative font-sans selection:bg-indigo-600 selection:text-white flex flex-col">
      <ParticleBackground />
      <ToastContainer />

      {/* Top Header */}
      <Header onNavigate={handleNavigate} />

      {/* App Body with Sidebar & View */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex relative z-10">
        <Sidebar currentRoute={currentRoute} onNavigate={handleNavigate} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 flex flex-col justify-between">
          <div>
            {renderView()}
          </div>
          <Footer onNavigate={handleNavigate} />
        </main>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />

      {/* Purchase Confirmation Modal */}
      {selectedService && (
        <ConfirmationModal
          service={selectedService}
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
          onSuccess={() => handleNavigate('/orders')}
          onNavigateAddFunds={() => handleNavigate('/add-funds')}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

