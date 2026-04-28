import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import ChatList from "./pages/ChatList.tsx";
import ChatDetail from "./pages/ChatDetail.tsx";
import SellProduct from "./pages/SellProduct.tsx";
import SellerDashboard from "./pages/SellerDashboard.tsx";
import KYCVerification from "./pages/KYCVerification.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import Profile from "./pages/Profile.tsx";
import MyOrders from "./pages/MyOrders.tsx";
import About from "./pages/About.tsx";
import NotFound from "./pages/NotFound.tsx";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          
          {/* Rute yang butuh Login saja (Auth UMUM) */}
          <Route path="/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><KYCVerification /></ProtectedRoute>} />
          
          {/* Rute KHUSUS Penjual (Seller) */}
          <Route path="/sell" element={<ProtectedRoute requireSeller={true}><SellProduct /></ProtectedRoute>} />
          <Route path="/seller" element={<ProtectedRoute requireSeller={true}><SellerDashboard /></ProtectedRoute>} />
          
          {/* Rute KHUSUS Admin */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute requireAdmin={true}><AdminPanel /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
