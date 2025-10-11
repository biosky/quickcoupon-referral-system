import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Store, CheckCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicCouponPage = () => {
  const { couponCode } = useParams();
  const [couponData, setCouponData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCouponData();
  }, [couponCode]);

  const fetchCouponData = async () => {
    try {
      const response = await axios.get(`${API}/public/coupon/${couponCode}`);
      setCouponData(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.detail || "Coupon not found");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="text-white text-xl">Loading offer...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Oops!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{
            fontFamily: '"Poppins", sans-serif'
          }}>QuickCoupon</h1>
          <p className="text-xl">Exclusive Offer for You!</p>
        </div>

        {/* Offer Card */}
        <Card className="shadow-2xl" data-testid="public-coupon-card">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-t-lg">
            <div className="flex items-center justify-center gap-3">
              <Gift className="w-8 h-8" />
              <CardTitle className="text-2xl md:text-3xl">CASHBACK OFFER!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Store Info */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Store className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold" data-testid="store-name">{couponData.store_name}</h2>
              </div>
              {couponData.store_description && (
                <p className="text-gray-600" data-testid="store-description">{couponData.store_description}</p>
              )}
            </div>

            {/* Cashback Amount */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-500 rounded-xl p-8 text-center">
              <p className="text-gray-600 mb-2">Get Cashback</p>
              <p className="text-5xl md:text-6xl font-bold text-green-600" data-testid="cashback-amount">
                ₹{couponData.cashback_amount}
              </p>
            </div>

            {/* Promotional Image */}
            {couponData.promotional_image && (
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={couponData.promotional_image} 
                  alt="Promotional offer" 
                  className="w-full h-auto"
                  data-testid="promotional-image"
                />
              </div>
            )}

            {/* Coupon Code */}
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Coupon Code</p>
              <p className="text-xl font-mono font-bold" data-testid="coupon-code-display">{couponData.coupon_code}</p>
            </div>

            {/* Status */}
            {couponData.is_redeemed && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">This offer has been redeemed!</span>
              </div>
            )}

            {/* CTA */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-purple-800 font-medium">
                Visit <span className="font-bold">{couponData.store_name}</span> and show this coupon to redeem your cashback!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-white/80 text-sm">
          <p>Powered by QuickCoupon Referral System</p>
        </div>
      </div>
    </div>
  );
};

export default PublicCouponPage;