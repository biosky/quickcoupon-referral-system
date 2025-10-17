# 💰 Adsterra Ads Setup Guide - Complete Instructions

## 📋 What is Adsterra?

Adsterra is an ad network that allows you to monetize your website by displaying ads. You earn money when users view or click on these ads.

---

## Part 1: Adsterra Account Creation

### Step 1: Sign Up as Publisher

1. Go to https://www.adsterra.com
2. Click **"Sign Up"** (top right)
3. Select **"I'm a Publisher"** (Website owner who wants to earn money)
4. Fill in the registration form:
   - Email address
   - Password
   - Website URL: `https://quickcoupon-frontend.onrender.com` (or your custom domain)
   - Website category: **E-commerce** or **Business**
   - Payment method: **PayPal**, **Wire Transfer**, or **Cryptocurrency**
5. Complete captcha
6. Click **"Create Account"**

### Step 2: Email Verification

1. Check your email for verification link
2. Click the link to verify your account
3. Log in to Adsterra Dashboard

### Step 3: Add Your Website

1. In Adsterra Dashboard, go to **"Websites"**
2. Click **"Add Website"**
3. Enter your website details:
   - **Website URL**: `https://quickcoupon-frontend.onrender.com`
   - **Category**: Business / E-commerce
   - **Description**: "QuickCoupon is a referral rewards system for physical stores"
   - **Traffic Source**: Organic, Social Media
   - **Monthly Visitors**: Estimate (can start with 1000)
4. Click **"Add Website"**

### Step 4: Website Approval (1-3 Days)

- Adsterra will review your website
- You'll receive email notification when approved
- Requirements:
  - ✅ Real website with actual content (you have this!)
  - ✅ No illegal content
  - ✅ Minimum traffic (any amount works)
  - ✅ English or major language

---

## Part 2: Generate Ad Codes (After Approval)

### Step 1: Navigate to Ad Creation

1. Log in to Adsterra Dashboard
2. Click **"Ad Formats"** or **"Get Code"**

### Step 2: Choose Ad Formats

You'll create **3 different ad formats** for optimal revenue:

---

### **Ad Format 1: Banner Ad (For Login Page)**

**Purpose:** Show banner below login/signup form

1. Select **"Social Bar"** or **"Banner"**
2. Configure:
   - Size: **320x50** (mobile-friendly)
   - Position: Custom
   - Website: Select your QuickCoupon website
3. Click **"Generate Code"**
4. You'll see code like:
   ```html
   <script type="text/javascript">
     atOptions = {
       'key' : 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
       'format' : 'iframe',
       'height' : 50,
       'width' : 320,
       'params' : {}
     };
   </script>
   <script type="text/javascript" src="//pl27869165.effectivegatecpm.com/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6/invoke.js"></script>
   ```
5. **Save the KEY**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` (example)

---

### **Ad Format 2: Native Banner (For Customer Dashboard Top)**

**Purpose:** Show non-intrusive banner at top of customer dashboard

1. Select **"Native Banner"**
2. Configure:
   - Size: **728x90** (standard leaderboard)
   - Website: Select your QuickCoupon website
3. Click **"Generate Code"**
4. **Save the KEY** from generated code

---

### **Ad Format 3: In-Page Push (For Between Sections)**

**Purpose:** Show between coupon sections in customer dashboard

1. Select **"In-Page Push"** or **"Banner"**
2. Configure:
   - Size: **300x250** (medium rectangle)
   - Website: Select your QuickCoupon website
3. Click **"Generate Code"**
4. **Save the KEY** from generated code

---

## Part 3: Update Your QuickCoupon App with Ad Keys

### What You Need to Extract from Adsterra Code:

From the generated code, you need **ONLY THE KEY**:

```html
<script type="text/javascript">
  atOptions = {
    'key' : 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',  ← THIS IS THE KEY
    ...
  };
</script>
```

### Step 1: Update Frontend Environment Variables

1. Go to **Render Dashboard** → Your **Frontend Static Site**
2. Go to **Environment** tab
3. Update or add these variables:

| Key | Value | Example |
|-----|-------|---------|
| `REACT_APP_ADS_ENABLED` | `true` | `true` |
| `REACT_APP_ADSTERRA_AD_KEY` | Your first ad key | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |

4. Click **"Save Changes"**
5. Render will automatically redeploy your frontend

### Step 2: For Multiple Ad Keys (Optional - Advanced)

If you want different ads in different places, add these:

| Key | Value | Where It Shows |
|-----|-------|----------------|
| `REACT_APP_ADSTERRA_LOGIN_KEY` | Key from Ad Format 1 | Login Page |
| `REACT_APP_ADSTERRA_DASHBOARD_TOP_KEY` | Key from Ad Format 2 | Customer Dashboard Top |
| `REACT_APP_ADSTERRA_DASHBOARD_MID_KEY` | Key from Ad Format 3 | Customer Dashboard Middle |

---

## Part 4: Verify Ads Are Working

### Step 1: Wait for Deployment

- After updating environment variables, wait 5-10 minutes for Render to redeploy

### Step 2: Test in Browser

1. Open your QuickCoupon website
2. Open **Browser Console** (Press F12 → Console tab)
3. Look for logs like:
   ```
   Adsterra ad script loaded successfully
   ```
4. Check for ad containers in the page
5. **Note:** Ads may take 5-30 seconds to load initially

### Step 3: Clear Cache if Needed

- Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
- This force refreshes and clears cache

---

## Part 5: Ad Placement Best Practices

### ✅ Good Placements (Already Implemented):

1. **Login Page** - Below "How It Works" section
2. **Customer Dashboard Top** - Small banner above content
3. **Customer Dashboard Middle** - Between "Create Coupon" and "My Coupons"

### ❌ Avoid:

- Too many ads (max 3 per page)
- Ads that cover important buttons
- Popup ads on first visit (can hurt user experience)

---

## Part 6: Track Your Earnings

### Adsterra Dashboard:

1. Go to https://publishers.adsterra.com
2. Log in with your credentials
3. Check **"Statistics"** for:
   - **Impressions**: How many times ads were shown
   - **Clicks**: How many times ads were clicked
   - **CPM**: Cost per 1000 impressions
   - **Revenue**: Total earnings

### Payment Information:

- **Minimum Payout**: $5 (NET-15) or $100 (NET-30)
- **Payment Methods**: PayPal, Wire Transfer, Bitcoin, WebMoney
- **Payment Dates**: 15th or 30th of each month
- **How much you earn**: 
  - Depends on traffic
  - Average: $1-5 per 1000 impressions (CPM)
  - Example: 10,000 visitors = $10-50/month

---

## 🔧 Troubleshooting

### Problem: Ads Not Showing

**Solution 1:** Check Account Status
- Verify website is approved in Adsterra Dashboard
- Check email for approval notification

**Solution 2:** Check Environment Variables
- Ensure `REACT_APP_ADS_ENABLED=true`
- Ensure `REACT_APP_ADSTERRA_AD_KEY` has correct key (40 characters)
- No spaces before/after the key

**Solution 3:** Check Browser
- Disable ad blockers (uBlock Origin, AdBlock Plus, etc.)
- Try in incognito/private mode
- Try different browser

**Solution 4:** Check Console
- Open browser console (F12)
- Look for errors related to Adsterra
- Look for blocked requests

**Solution 5:** Wait 24-48 Hours
- Sometimes Adsterra needs time to start serving ads
- Initial approval doesn't mean instant ads

---

### Problem: Low Earnings

**Solutions:**
1. **Increase Traffic**: Promote your app on social media
2. **Optimize Ad Placement**: Test different positions
3. **Improve User Engagement**: More time on site = more impressions
4. **Geographic Targeting**: US/UK/Canada traffic pays more

---

### Problem: Account Suspended

**Reasons:**
- Invalid traffic (bots, paid traffic)
- Click fraud
- Adult content
- Copyright violations

**Solution:**
- Contact Adsterra support
- Provide traffic sources proof
- Be honest and transparent

---

## 📊 Expected Revenue Calculator

| Monthly Visitors | Impressions | Estimated Earnings (CPM $2-5) |
|-----------------|-------------|-------------------------------|
| 1,000 | 3,000 | $6 - $15 |
| 5,000 | 15,000 | $30 - $75 |
| 10,000 | 30,000 | $60 - $150 |
| 50,000 | 150,000 | $300 - $750 |
| 100,000 | 300,000 | $600 - $1,500 |

*Note: Actual earnings vary based on niche, geography, and engagement*

---

## 🎯 Advanced Tips

### Increase Revenue:

1. **Test Different Ad Formats**
   - Try different sizes
   - A/B test positions

2. **Optimize for Mobile**
   - 60-80% traffic is mobile
   - Use mobile-friendly ad sizes

3. **Quality Traffic**
   - Focus on organic traffic (SEO)
   - Social media marketing
   - Word of mouth

4. **User Experience**
   - Don't overload with ads
   - Fast loading site = better earnings

---

## 📞 Adsterra Support

- **Email**: publishers@adsterra.com
- **Live Chat**: Available in dashboard
- **Telegram**: @adsterrasupport
- **Response Time**: 24-48 hours

---

## ✅ Final Checklist

- [ ] Adsterra account created
- [ ] Website added and approved
- [ ] Ad codes generated (save the keys)
- [ ] Environment variables updated on Render
- [ ] Frontend redeployed
- [ ] Ads visible on website (may take time)
- [ ] No ad blocker active while testing
- [ ] Statistics tracking in Adsterra dashboard

---

## 🎉 Congratulations!

Your QuickCoupon app is now monetized with Adsterra ads!

**Next Steps:**
1. Promote your app to get traffic
2. Monitor earnings in Adsterra dashboard
3. Optimize ad placements for better revenue
4. Scale your business!

---

**Questions?** Check Adsterra's help center: https://help.adsterra.com
