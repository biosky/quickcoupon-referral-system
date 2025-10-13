import { useState, useEffect } from "react";
import "@/App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import LoginPage from "@/pages/LoginPage";
import CustomerDashboard from "@/pages/CustomerDashboard";
import ShopkeeperDashboard from "@/pages/ShopkeeperDashboard";
import PublicCouponPage from "@/pages/PublicCouponPage";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Setup axios defaults
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API}/auth/me`)
        .then(response => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      <HashRouter>
        <Routes>
          <Route path="/login" element={
            user ? 
              (user.role === 'customer' ? <Navigate to="/customer" /> : <Navigate to="/shopkeeper" />) 
              : <LoginPage setUser={setUser} />
          } />
          
          <Route path="/customer" element={
            user && user.role === 'customer' ? 
              <CustomerDashboard user={user} onLogout={handleLogout} /> 
              : <Navigate to="/login" />
          } />
          
          <Route path="/shopkeeper" element={
            user && user.role === 'shopkeeper' ? 
              <ShopkeeperDashboard user={user} onLogout={handleLogout} /> 
              : <Navigate to="/login" />
          } />
          
          <Route path="/coupon/:couponCode" element={<PublicCouponPage />} />
          
          <Route path="/" element={
            user ? 
              (user.role === 'customer' ? <Navigate to="/customer" /> : <Navigate to="/shopkeeper" />) 
              : <Navigate to="/login" />
          } />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;