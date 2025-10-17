import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Copy, Gift, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdsterraAd from "@/components/AdsterraAd";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Adsterra Ad Configuration
const ADS_ENABLED = process.env.REACT_APP_ADS_ENABLED === 'true';
const AD_KEY = process.env.REACT_APP_ADSTERRA_AD_KEY;

const CustomerDashboard = ({ user, onLogout }) => {
  const location = useLocation();
  const [shopkeepers, setShopkeepers] = useState([]);
  const [selectedShopkeeper, setSelectedShopkeeper] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [redeemedCoupon, setRedeemedCoupon] = useState(null);
  const [redeemEnabled, setRedeemEnabled] = useState({});

  useEffect(() => {
    fetchShopkeepers();
    fetchCoupons();
    
    // Check if shopkeeper_id is in URL params (from QR code scan)
    const params = new URLSearchParams(location.search);
    const shopkeeperId = params.get('shopkeeper_id');
    if (shopkeeperId) {
      setSelectedShopkeeper(shopkeeperId);
      toast.success("Shopkeeper ID loaded from QR code!");
    }
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchCoupons, 5000);
    return () => clearInterval(interval);
  }, [location]);

  const fetchShopkeepers = async () => {
    try {
      const response = await axios.get(`${API}/public/shopkeepers`);
      setShopkeepers(response.data);
    } catch (error) {
      console.error("Error fetching shopkeepers:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/customer/coupons`);
      setCoupons(response.data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  const handleCreateCoupon = async () => {
    if (!selectedShopkeeper) {
      toast.error("Please select a store");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/customer/coupon`, {
        shopkeeper_id: selectedShopkeeper
      });
      toast.success("Coupon created successfully!");
      fetchCoupons();
      setSelectedShopkeeper("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create coupon");
    }
    setLoading(false);
  };

  const handleCopyLink = async (coupon) => {
    const link = `${window.location.origin}/#/coupon/${coupon.coupon_code}`;
    
    try {
      await navigator.clipboard.writeText(link);
      
      // Track click
      const response = await axios.post(`${API}/customer/click`, {
        coupon_code: coupon.coupon_code
      });

      if (response.data.already_redeemed) {
        toast.info("Coupon already redeemed!");
        return;
      }

      toast.success(`Link copied! (Click ${response.data.click_count}/3)`);

      // Check if can redeem (reached 3 clicks)
      if (response.data.can_redeem && response.data.click_count >= 3) {
        toast.info("Processing... Please wait");
        
        // Wait 2.5 seconds before enabling redeem button
        setTimeout(() => {
          setRedeemEnabled(prev => ({
            ...prev,
            [coupon.coupon_code]: true
          }));
          toast.success("You can now redeem your cashback!");
        }, 2500);
      }

      // Refresh coupons
      fetchCoupons();
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleRedeem = async (coupon) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/customer/redeem`, {
        coupon_code: coupon.coupon_code
      });

      if (response.data.is_redeemed) {
        setRedeemedCoupon({
          ...coupon,
          cashback_earned: response.data.cashback_earned
        });
        setShowCongrats(true);
        
        // Disable the redeem button for this coupon
        setRedeemEnabled(prev => ({
          ...prev,
          [coupon.coupon_code]: false
        }));
        
        // Refresh coupons
        fetchCoupons();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to redeem coupon");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{
              fontFamily: '"Poppins", sans-serif'
            }}>QuickCoupon</h1>
            <p className="text-white/80 text-sm">Welcome, {user.username}!</p>
          </div>
          <Button onClick={onLogout} variant="outline" className="bg-white/20 text-white border-white/30 hover:bg-white/30" data-testid="logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Top Banner Ad - Small and Non-intrusive */}
        {ADS_ENABLED && AD_KEY && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="text-xs text-gray-400 text-center mb-2">Sponsored</div>
            <AdsterraAd
              atOptions={{
                key: AD_KEY,
                format: 'iframe',
                height: 90,
                width: 728,
                params: {}
              }}
              scriptSrc={`https://pl27869165.effectivegatecpm.com/${AD_KEY}/invoke.js`}
              containerId={`adsterra-top-${AD_KEY}`}
            />
          </div>
        )}

        {/* CASHBACK Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-center shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">CASHBACK / COMBO</h2>
          <p className="text-white/90">Share 3 times and earn rewards!</p>
        </div>

        {/* Create Coupon Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Create New Coupon
            </CardTitle>
            <CardDescription>Enter the unique Shopkeeper ID provided by the store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="shopkeeper-id" className="block text-sm font-medium mb-2">
                Shopkeeper ID
              </label>
              <Input
                id="shopkeeper-id"
                data-testid="shopkeeper-id-input"
                type="text"
                value={selectedShopkeeper}
                onChange={(e) => setSelectedShopkeeper(e.target.value)}
                placeholder="Enter Shopkeeper ID (e.g., abc123...)"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Ask the shopkeeper for their unique ID or scan their QR code
              </p>
            </div>
            <Button onClick={handleCreateCoupon} disabled={loading} className="w-full" data-testid="create-coupon-btn">
              {loading ? "Creating..." : "Create Coupon"}
            </Button>
          </CardContent>
        </Card>

        {/* Subtle Ad - Between Sections */}
        {ADS_ENABLED && AD_KEY && (
          <div className="my-6 flex justify-center">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-w-2xl w-full">
              <div className="text-xs text-gray-400 mb-2 text-center">Advertisement</div>
              <AdsterraAd
                atOptions={{
                  key: AD_KEY,
                  format: 'iframe',
                  height: 250,
                  width: 300,
                  params: {}
                }}
                scriptSrc={`https://pl27869165.effectivegatecpm.com/${AD_KEY}/invoke.js`}
                containerId={`adsterra-between-${AD_KEY}`}
              />
            </div>
          </div>
        )}

        {/* My Coupons */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>My Coupons</CardTitle>
            <CardDescription>Click "Copy Link" to share with friends and earn cashback</CardDescription>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No coupons yet. Create one to get started!</p>
            ) : (
              <div className="grid gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{coupon.store_name || 'Store'}</h3>
                        <p className="text-sm text-gray-600">Code: {coupon.coupon_code}</p>
                        <p className="text-sm font-medium text-green-600 mt-1">{coupon.cashback_offer}</p>
                      </div>
                      {coupon.is_redeemed ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Redeemed
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    
                    {!coupon.is_redeemed && (
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleCopyLink(coupon)} 
                          className="w-full"
                          data-testid={`copy-link-btn-${coupon.coupon_code}`}
                          disabled={coupon.click_count >= 3}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {coupon.click_count >= 3 ? `Clicked ${coupon.click_count}/3 ✓` : `Copy Link (${coupon.click_count}/3)`}
                        </Button>
                        
                        {coupon.click_count >= 3 && (
                          <Button 
                            onClick={() => handleRedeem(coupon)} 
                            className="w-full bg-green-600 hover:bg-green-700"
                            data-testid={`redeem-btn-${coupon.coupon_code}`}
                            disabled={!redeemEnabled[coupon.coupon_code] || loading}
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            {redeemEnabled[coupon.coupon_code] ? 'Redeem Cashback' : 'Please Wait...'}
                          </Button>
                        )}
                      </div>
                    )}

                    {coupon.is_redeemed && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-green-700 font-semibold">Cashback Earned: ₹{coupon.cashback_earned}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <p>Create a coupon after shopping at your favorite store</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <p>Click the "Copy Link" button 3 times to share the offer with friends</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <p>After your 3rd click, you instantly earn the cashback/combo!</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <p>Your friends see the store's promotional offers when they open the link</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Congratulations Dialog */}
      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="sm:max-w-md" data-testid="congrats-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎉 Congratulations! 🎉</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <div className="space-y-4">
                <p className="text-lg font-semibold text-green-600">
                  You have successfully earned the cashback!
                </p>
                {redeemedCoupon && (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-700">₹{redeemedCoupon.cashback_earned}</p>
                    <p className="text-sm text-gray-600 mt-1">Cashback Earned</p>
                  </div>
                )}
                <p className="text-gray-600">Your cashback has been credited to your account!</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowCongrats(false)} className="w-full" data-testid="congrats-close-btn">
            Awesome!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;