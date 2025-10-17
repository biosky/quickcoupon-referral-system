import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, CheckCircle, Clock, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicCouponGenerator = () => {
  const location = useLocation();
  const [shopkeeperId, setShopkeeperId] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [redeemEnabled, setRedeemEnabled] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);

  useEffect(() => {
    // Get shopkeeper_id from URL and auto-generate coupon
    const params = new URLSearchParams(location.search);
    const id = params.get('shopkeeper_id');
    if (id) {
      setShopkeeperId(id);
      fetchShopInfo(id);
      autoGenerateCoupon(id);
    } else {
      setLoading(false);
      toast.error("Invalid QR code - missing shopkeeper ID");
    }
  }, [location]);

  const fetchShopInfo = async (id) => {
    try {
      const response = await axios.get(`${API}/public/shopkeeper/${id}`);
      setShopInfo(response.data);
    } catch (error) {
      console.error("Error fetching shop info:", error);
    }
  };

  const autoGenerateCoupon = async (id) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/public/generate-coupon`, {
        shopkeeper_id: id
      });
      setCoupon(response.data);
      setClickCount(response.data.click_count || 0);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate coupon");
    }
    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (!coupon) return;

    const link = `${window.location.origin}/#/coupon/${coupon.coupon_code}`;
    
    try {
      await navigator.clipboard.writeText(link);
      
      // Track click (no customer data needed)
      const response = await axios.post(`${API}/public/track-click`, {
        coupon_code: coupon.coupon_code
      });

      const newClickCount = response.data.click_count;
      setClickCount(newClickCount);
      toast.success(`Link copied! (Click ${newClickCount}/3)`);

      // Check if can redeem
      if (newClickCount >= 3 && !redeemEnabled) {
        toast.info("Processing... Please wait");
        setTimeout(() => {
          setRedeemEnabled(true);
          toast.success("You can now redeem your cashback!");
        }, 2500);
      }
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleRedeem = async () => {
    if (!coupon) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/public/redeem-coupon`, {
        coupon_code: coupon.coupon_code
      });

      if (response.data.is_redeemed) {
        setCoupon({ ...coupon, is_redeemed: true, cashback_earned: response.data.cashback_earned });
        setShowCongrats(true);
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
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{
            fontFamily: '"Poppins", sans-serif'
          }}>
            <QrCode className="inline-block w-12 h-12 mb-2" />
            <br />
            QuickCoupon
          </h1>
          <p className="text-xl">Generate Your Coupon</p>
        </div>

        {/* Shop Info */}
        {shopInfo && (
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">{shopInfo.store_name}</h2>
              <p className="text-green-600 font-semibold text-lg">{shopInfo.cashback_offer}</p>
            </CardContent>
          </Card>
        )}

        {!coupon ? (
          /* Generate Coupon Form */
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Get Your Coupon</CardTitle>
              <CardDescription>Enter your details to generate your cashback coupon</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateCoupon} className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Your Name (Optional)</Label>
                  <Input
                    id="customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="customer-phone">Phone Number *</Label>
                  <Input
                    id="customer-phone"
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Generating..." : "Generate Coupon"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Coupon Display */
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Your Coupon
              </CardTitle>
              <CardDescription>Share 3 times to earn cashback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-500 rounded-xl p-6 text-center">
                <p className="text-gray-600 mb-2">Coupon Code</p>
                <p className="text-3xl font-bold text-green-600 font-mono">{coupon.coupon_code}</p>
                {coupon.is_redeemed ? (
                  <Badge className="mt-3 bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Redeemed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-3">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>

              {!coupon.is_redeemed && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleCopyLink}
                    className="w-full"
                    disabled={clickCount >= 3}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {clickCount >= 3 ? `Clicked ${clickCount}/3 ✓` : `Copy Link (${clickCount}/3)`}
                  </Button>
                  
                  {clickCount >= 3 && (
                    <Button 
                      onClick={handleRedeem}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!redeemEnabled || loading}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {redeemEnabled ? 'Redeem Cashback' : 'Please Wait...'}
                    </Button>
                  )}
                </div>
              )}

              {coupon.is_redeemed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-semibold text-lg">
                    🎉 Cashback Earned: {coupon.cashback_earned}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="shadow-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-white/90 space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Enter your phone number to generate coupon</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Click "Copy Link" button 3 times to share with friends</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>After 3rd click, redeem button activates</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Click "Redeem" to earn your cashback!</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Congratulations Dialog */}
      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎉 Congratulations! 🎉</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <div className="space-y-4">
                <p className="text-lg font-semibold text-green-600">
                  You have successfully earned the cashback!
                </p>
                {coupon && (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-700">{coupon.cashback_earned}</p>
                    <p className="text-sm text-gray-600 mt-1">Cashback Earned</p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowCongrats(false)} className="w-full">
            Awesome!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicCouponGenerator;
