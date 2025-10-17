import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Gift, CheckCircle, Clock, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicCouponGenerator = () => {
  const location = useLocation();
  const [shopkeeperId, setShopkeeperId] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [redeemEnabled, setRedeemEnabled] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);
  const [shareClicked, setShareClicked] = useState(false);

  // Check if share was previously clicked (from localStorage)
  useEffect(() => {
    if (coupon) {
      const storedShare = localStorage.getItem(`share_${coupon.coupon_code}`);
      if (storedShare === 'true') {
        setShareClicked(true);
        setRedeemEnabled(true);
      }
    }
  }, [coupon]);

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

  // Multiple detection methods for Android/iOS compatibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && shareClicked && !redeemEnabled) {
        // Customer returned to the page after sharing
        toast.success("Welcome back! You can now redeem your cashback!");
        setRedeemEnabled(true);
      }
    };

    const handleFocus = () => {
      // Fallback for Android - focus event
      if (shareClicked && !redeemEnabled) {
        console.log('Window focus detected - enabling redeem');
        setRedeemEnabled(true);
      }
    };

    const handleResume = () => {
      // Android-specific resume event
      if (shareClicked && !redeemEnabled) {
        console.log('Resume detected - enabling redeem');
        setRedeemEnabled(true);
      }
    };

    // Add all event listeners for maximum compatibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);
    document.addEventListener('resume', handleResume);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
      document.removeEventListener('resume', handleResume);
    };
  }, [shareClicked, redeemEnabled]);

  const fetchShopInfo = async (id) => {
    try {
      const response = await axios.get(`${API}/public/shopkeeper/${id}`);
      setShopInfo(response.data);
    } catch (error) {
      console.error("Error fetching shop info:", error);
      if (error.response?.status === 404) {
        toast.error("Invalid QR code - shopkeeper not found");
      }
    }
  };

  const autoGenerateCoupon = async (id) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/public/generate-coupon`, {
        shopkeeper_id: id
      });
      setCoupon(response.data);
      setShareClicked(response.data.share_clicked || false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate coupon");
    }
    setLoading(false);
  };

  const handleWhatsAppShare = async () => {
    if (!coupon) return;

    const link = `${window.location.origin}/#/coupon/${coupon.coupon_code}`;
    
    // Try to copy link to clipboard (optional)
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    } catch (clipboardError) {
      console.warn("Clipboard access denied:", clipboardError);
      // Continue without clipboard - not a critical failure
    }
    
    try {
      // Track share in backend
      await axios.post(`${API}/public/track-share`, {
        coupon_code: coupon.coupon_code
      });

      setShareClicked(true);
      
      // Create WhatsApp message
      const message = `🎉 Hey! Check out this amazing offer from ${shopInfo?.store_name || 'our store'}!

💰 ${shopInfo?.cashback_offer || 'Special offer'}

🔗 Use my coupon: ${link}

Generated via QuickCoupon`;
      
      // Use WhatsApp URL that works on both mobile and desktop
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      
      // Always open in new tab/window to avoid navigation issues
      const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      if (!whatsappWindow) {
        // If popup blocked, try direct link
        toast.warning("Please allow popups and try again");
        window.location.href = whatsappUrl;
      } else {
        toast.info("WhatsApp opened! Come back here after sharing to redeem.");
      }
      
    } catch (error) {
      console.error("WhatsApp share error:", error);
      toast.error("Failed to open WhatsApp. Link is copied - you can paste it manually!");
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
              {/* Promotional Image */}
              {shopInfo.promotional_image && (
                <div className="mb-4 flex justify-center">
                  <img 
                    src={shopInfo.promotional_image} 
                    alt={shopInfo.store_name}
                    className="max-w-full h-auto rounded-lg shadow-md"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{shopInfo.store_name}</h2>
              <p className="text-green-600 font-semibold text-lg mb-2">{shopInfo.cashback_offer}</p>
              {shopInfo.store_description && (
                <p className="text-gray-600 text-sm">{shopInfo.store_description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Generating your coupon...</p>
            </CardContent>
          </Card>
        ) : coupon ? (
          /* Coupon Display */
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Your Coupon
              </CardTitle>
              <CardDescription>Share on WhatsApp to unlock your cashback!</CardDescription>
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
                <div className="space-y-3">
                  {!shareClicked ? (
                    <Button 
                      onClick={handleWhatsAppShare}
                      className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Share via WhatsApp
                    </Button>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-green-700 font-semibold text-sm">
                          ✓ Shared on WhatsApp
                        </p>
                      </div>
                      
                      {redeemEnabled ? (
                        <Button 
                          onClick={handleRedeem}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
                          disabled={loading}
                        >
                          <Gift className="w-5 h-5 mr-2" />
                          Redeem Cashback Now!
                        </Button>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-blue-700 text-sm">
                            Come back to this page after sharing to redeem your cashback!
                          </p>
                        </div>
                      )}
                    </>
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
        ) : null}

        {/* How It Works */}
        <Card className="shadow-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-white/90 space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Scan QR code to generate your unique coupon instantly</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Click "Share via WhatsApp" to share with your friends</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Return to this page after sharing</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Click "Redeem Cashback" to claim your reward!</span>
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
