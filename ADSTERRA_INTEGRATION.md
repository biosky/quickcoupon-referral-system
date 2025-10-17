# Adsterra Ad Integration Guide

This document explains how to integrate Adsterra ads into QuickCoupon.

## Step 1: Create Adsterra Account

1. Go to https://adsterra.com
2. Click "Sign Up" → Select "Publisher"
3. Fill in registration form
4. Verify your email
5. Login to Adsterra Dashboard

## Step 2: Add Your Website

1. In Adsterra Dashboard → Click "Websites"
2. Click "Add Website"
3. Enter your domain: `quickcoupon-frontend.onrender.com`
4. Select category (e.g., "Coupons & Deals")
5. Click "Submit"
6. Wait ~10 minutes for approval

## Step 3: Generate Ad Codes

After approval, generate ad codes for different formats:

### A) Social Bar (For Customer Dashboard)
1. Select your website → Click "Get Code"
2. Choose format: "Social Bar"
3. Copy the script src URL (e.g., `//pl123456.profitablegatecpm.com/123456/invoke.js`)
4. Copy the ad key (e.g., `abcd1234efgh5678`)

### B) Native Banner (For Login Page)
1. Choose format: "Native Banner" 
2. Copy script src and ad key

### C) Popunder (For Public Coupon Pages)
1. Choose format: "Popunder"
2. Copy script src

## Step 4: Configure Environment Variables

Update your `/app/frontend/.env` file:

```env
# Enable ads
REACT_APP_ADS_ENABLED=true

# Social Bar
REACT_APP_ADSTERRA_SOCIAL_BAR_SRC=//pl123456.profitablegatecpm.com/123456/invoke.js
REACT_APP_ADSTERRA_SOCIAL_BAR_KEY=abcd1234efgh5678

# Native Banner
REACT_APP_ADSTERRA_NATIVE_BANNER_SRC=//pl123456.profitablegatecpm.com/456789/invoke.js
REACT_APP_ADSTERRA_NATIVE_BANNER_KEY=ijkl9012mnop3456

# Popunder
REACT_APP_ADSTERRA_POPUNDER_SRC=//pl123456.profitablegatecpm.com/789012/invoke.js
```

## Step 5: Add Ads to Pages

### Customer Dashboard
Add Social Bar ad at the bottom:

```jsx
import AdsterraAd from '@/components/AdsterraAd';
import { adConfig } from '@/config/adConfig';

// In your CustomerDashboard component, add:
{adConfig.socialBar.enabled && (
  <AdsterraAd
    scriptSrc={adConfig.socialBar.scriptSrc}
    atOptions={adConfig.socialBar.atOptions}
    containerId={adConfig.socialBar.containerId}
    className="fixed bottom-0 left-0 right-0 z-50"
  />
)}
```

### Login Page
Add Native Banner ad:

```jsx
{adConfig.nativeBanner.enabled && (
  <AdsterraAd
    scriptSrc={adConfig.nativeBanner.scriptSrc}
    atOptions={adConfig.nativeBanner.atOptions}
    containerId={adConfig.nativeBanner.containerId}
    className="my-4"
  />
)}
```

### Public Coupon Page
Add Popunder ad (loads automatically):

```jsx
{adConfig.popunder.enabled && (
  <AdsterraAd
    scriptSrc={adConfig.popunder.scriptSrc}
    containerId={adConfig.popunder.containerId}
  />
)}
```

## Step 6: Deploy and Test

1. Update environment variables on Render
2. Redeploy frontend
3. Visit your site and verify ads load
4. Check Adsterra Dashboard for impressions

## Best Practices

✅ **Do:**
- Place Social Bar at bottom on mobile
- Keep login page ads minimal
- Use Native Banners in sidebars
- Monitor performance metrics

❌ **Don't:**
- Place too many ads on one page
- Cover important buttons with ads
- Use aggressive ad formats on login

## Troubleshooting

**Ads not showing?**
- Check `REACT_APP_ADS_ENABLED=true`
- Verify ad codes are correct
- Check browser console for errors
- Disable ad blocker for testing

**Revenue not tracking?**
- Wait 24 hours for stats to appear
- Check Adsterra Dashboard → Statistics
- Verify impressions are counted

## Support

- Adsterra Support: https://adsterra.com/support
- Minimum payout: $5 (Paxum), $100 (PayPal)
- Payment schedule: NET15 (twice monthly)
