import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Store, BarChart3, Ticket, CheckCircle, Clock, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ShopkeeperDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    store_name: "",
    cashback_offer: "",
    store_description: "",
    promotional_image: null
  });
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchCoupons();
    fetchAnalytics();
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchCoupons();
      fetchAnalytics();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/shopkeeper/profile`);
      if (response.data) {
        setProfile(response.data);
        setProfileForm({
          store_name: response.data.store_name,
          cashback_offer: response.data.cashback_offer,
          store_description: response.data.store_description || "",
          promotional_image: null
        });
        setImagePreview(response.data.promotional_image);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/shopkeeper/coupons`);
      setCoupons(response.data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/shopkeeper/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileForm({ ...profileForm, promotional_image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('store_name', profileForm.store_name);
      formData.append('cashback_offer', profileForm.cashback_offer);
      if (profileForm.store_description) {
        formData.append('store_description', profileForm.store_description);
      }
      if (profileForm.promotional_image) {
        formData.append('promotional_image', profileForm.promotional_image);
      }

      await axios.post(`${API}/shopkeeper/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    }
    setLoading(false);
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you sure you want to delete your profile? This action cannot be undone and will remove all your coupons.")) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API}/shopkeeper/profile`);
      toast.success("Profile deleted successfully");
      localStorage.removeItem('token');
      onLogout();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete profile");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{
              fontFamily: '"Poppins", sans-serif'
            }}>QuickCoupon - Shopkeeper</h1>
            <p className="text-gray-600 text-sm">Welcome, {user.username}!</p>
          </div>
          <Button onClick={onLogout} variant="outline" data-testid="shopkeeper-logout-btn">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <Store className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="coupons" data-testid="tab-coupons">
              <Ticket className="w-4 h-4 mr-2" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Store Profile</CardTitle>
                <CardDescription>Customize your store details and promotional materials</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Shopkeeper QR Code & ID Display */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
                    <Label className="text-lg font-bold text-blue-900 mb-4 block text-center">Customer QR Code</Label>
                    
                    {/* QR Code Display */}
                    <div id="shopkeeper-qr-code" className="bg-white p-6 rounded-lg shadow-md mb-4 flex justify-center">
                      <QRCode 
                        value={`${window.location.origin}/#/create-coupon?shopkeeper_id=${user.id}`}
                        size={200}
                        level="H"
                      />
                    </div>
                    
                    <div className="text-center mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">📱 Customers can scan this QR code</p>
                      <p className="text-xs text-blue-700">
                        It will take them directly to the coupon creation page with your store pre-selected
                      </p>
                    </div>

                    {/* Download QR Code Button */}
                    <Button
                      type="button"
                      onClick={() => {
                        const svg = document.querySelector('#shopkeeper-qr-code svg');
                        if (svg) {
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.fillStyle = 'white';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            const pngFile = canvas.toDataURL('image/png');
                            const downloadLink = document.createElement('a');
                            downloadLink.download = `${profileForm.store_name || 'store'}-qr-code.png`;
                            downloadLink.href = pngFile;
                            downloadLink.click();
                          };
                          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                        }
                        toast.success("QR Code downloaded!");
                      }}
                      className="w-full mb-3"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>

                    {/* ID for manual entry */}
                    <div className="border-t pt-4">
                      <Label className="text-xs text-gray-600 mb-2 block">Or share your Shopkeeper ID:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={user.id}
                          readOnly
                          className="bg-white font-mono text-xs"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(user.id);
                            toast.success("ID copied!");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                      id="store_name"
                      data-testid="store-name-input"
                      value={profileForm.store_name}
                      onChange={(e) => setProfileForm({...profileForm, store_name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cashback_offer">Cashback / Offer</Label>
                    <Input
                      id="cashback_offer"
                      data-testid="cashback-offer-input"
                      type="text"
                      value={profileForm.cashback_offer}
                      onChange={(e) => setProfileForm({...profileForm, cashback_offer: e.target.value})}
                      required
                      placeholder="e.g., ₹100 or 2 Free Coffees or Buy 1 Get 1"
                    />
                    <p className="text-sm text-gray-500 mt-1">Enter amount (₹100) or offer text (2 Free Coffees)</p>
                  </div>

                  <div>
                    <Label htmlFor="store_description">Store Description</Label>
                    <Textarea
                      id="store_description"
                      data-testid="store-description-input"
                      value={profileForm.store_description}
                      onChange={(e) => setProfileForm({...profileForm, store_description: e.target.value})}
                      rows={3}
                      placeholder="Describe your store and offers..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="promotional_image">Promotional Image / Pamphlet</Label>
                    <Input
                      id="promotional_image"
                      data-testid="promotional-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="mt-4">
                        <img src={imagePreview} alt="Preview" className="max-w-md rounded-lg shadow-md" />
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full" data-testid="update-profile-btn">
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                  
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-3">Once you delete your profile, there is no going back. This will remove your store from the website and delete all associated coupons.</p>
                    <Button 
                      type="button"
                      onClick={handleDeleteProfile} 
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700"
                      data-testid="delete-profile-btn"
                    >
                      Delete Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>All Coupons</CardTitle>
                <CardDescription>View and manage customer coupons</CardDescription>
              </CardHeader>
              <CardContent>
                {coupons.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No coupons generated yet</p>
                ) : (
                  <div className="space-y-3">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">Code: {coupon.coupon_code}</p>
                            <p className="text-sm text-gray-600">Customer: {coupon.customer_username}</p>
                            <p className="text-sm text-gray-600">Clicks: {coupon.click_count}/3</p>
                            {coupon.is_redeemed && (
                              <p className="text-sm font-medium text-green-600 mt-1">
                                Cashback Given: ₹{coupon.cashback_earned}
                              </p>
                            )}
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Coupons</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" data-testid="analytics-total-coupons">{analytics?.total_coupons || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Redeemed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600" data-testid="analytics-redeemed">{analytics?.redeemed_coupons || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600" data-testid="analytics-pending">{analytics?.pending_coupons || 0}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ShopkeeperDashboard;