# 🚀 QuickCoupon Deployment Checklist

Use this as your quick reference while deploying!

---

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] All features tested locally
- [ ] MongoDB Atlas account created
- [ ] Render account created

---

## MongoDB Setup (5 minutes)

- [ ] Create free M0 cluster
- [ ] Create database user
- [ ] Whitelist all IPs (0.0.0.0/0)
- [ ] Copy connection string
- [ ] Replace password in connection string
- [ ] Add SSL parameters to connection string

**Connection String Format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE
```

---

## Backend Deployment (10 minutes)

- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Set root directory: `backend`
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn server:app --host 0.0.0.0 --port 8001`
- [ ] Add environment variables:
  - [ ] `MONGO_URL`
  - [ ] `DB_NAME` = `quickcoupon`
  - [ ] `JWT_SECRET` = `[random_secure_string]`
  - [ ] `CORS_ORIGINS` = `*` (update later)
  - [ ] `PYTHON_VERSION` = `3.11.0`
- [ ] Deploy and wait
- [ ] Copy backend URL (e.g., `https://quickcoupon-backend.onrender.com`)
- [ ] Test: `curl https://YOUR-BACKEND-URL/`

---

## Frontend Deployment (10 minutes)

- [ ] Create new Static Site on Render
- [ ] Connect same GitHub repository
- [ ] Set root directory: `frontend`
- [ ] Set build command: `yarn install && yarn build`
- [ ] Set publish directory: `build`
- [ ] Add environment variables:
  - [ ] `REACT_APP_BACKEND_URL` = `[YOUR_BACKEND_URL]`
  - [ ] `NODE_VERSION` = `18`
  - [ ] `REACT_APP_ADS_ENABLED` = `true`
  - [ ] `REACT_APP_ADSTERRA_AD_KEY` = `[LEAVE EMPTY, ADD LATER]`
- [ ] Deploy and wait
- [ ] Copy frontend URL (e.g., `https://quickcoupon-frontend.onrender.com`)
- [ ] Test: Open frontend URL in browser

---

## Backend CORS Update

- [ ] Go to backend service on Render
- [ ] Update `CORS_ORIGINS` = `[YOUR_FRONTEND_URL]`
- [ ] Save and wait for redeploy

---

## Basic Testing (5 minutes)

- [ ] Open frontend URL
- [ ] Create shopkeeper account
- [ ] Create shopkeeper profile
- [ ] Create customer account
- [ ] Generate coupon
- [ ] Test WhatsApp share
- [ ] Test redemption

---

## Adsterra Setup (1-3 days for approval)

### Day 1: Sign Up
- [ ] Sign up at https://www.adsterra.com as Publisher
- [ ] Verify email
- [ ] Add website to Adsterra
- [ ] Submit for approval

### Day 2-3: Wait for Approval
- [ ] Check email for approval notification
- [ ] Check Adsterra dashboard status

### After Approval: Generate Ads
- [ ] Generate ad code (Banner 320x50)
- [ ] Copy the ad KEY (40 character string)
- [ ] Go to Render → Frontend → Environment
- [ ] Update `REACT_APP_ADSTERRA_AD_KEY` with your key
- [ ] Save and redeploy
- [ ] Wait 5-10 minutes
- [ ] Check website for ads (disable ad blocker)

---

## Custom Domain (Optional)

- [ ] Buy domain (e.g., quickcoupon.com)
- [ ] Add custom domain in Render (both frontend & backend)
- [ ] Update DNS records at domain registrar
- [ ] Wait for DNS propagation (10-60 minutes)
- [ ] Update `REACT_APP_BACKEND_URL` if backend domain changed
- [ ] Update `CORS_ORIGINS` on backend

---

## Final Verification

- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Can create accounts
- [ ] Can generate coupons
- [ ] WhatsApp sharing works
- [ ] Redemption flow works
- [ ] QR codes work
- [ ] Ads showing (after Adsterra approval)

---

## URLs to Save

**Backend URL:** `_________________________________`

**Frontend URL:** `_________________________________`

**MongoDB Connection:** `_________________________________`

**Adsterra Ad Key:** `_________________________________`

**Custom Domain (if any):** `_________________________________`

---

## Important Notes

⚠️ **Free Tier Limitations:**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free

💡 **Upgrade to Paid ($7/month) for:**
- No sleep
- Better performance
- Faster response times

📊 **Adsterra Earnings:**
- Minimum payout: $5-100 depending on plan
- Average CPM: $1-5 per 1000 impressions
- Payment: Monthly (15th or 30th)

---

## Troubleshooting Quick Fixes

**Backend won't start:**
```
Check logs → Verify MONGO_URL → Check all env vars
```

**Frontend can't connect:**
```
Check REACT_APP_BACKEND_URL → Check CORS_ORIGINS → Check backend is running
```

**Ads not showing:**
```
Check approval status → Verify ad key is correct → Disable ad blocker → Wait 24-48 hours
```

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **MongoDB Docs:** https://docs.mongodb.com/
- **Adsterra Help:** https://help.adsterra.com
- **Adsterra Support:** publishers@adsterra.com

---

## 🎉 You're Done!

Your QuickCoupon app is now:
- ✅ Deployed on Render
- ✅ Connected to MongoDB
- ✅ Ready for users
- ✅ Monetized with Adsterra (after approval)

**Next:** Start promoting your app and watch your earnings grow! 📈

---

*For detailed step-by-step instructions, see:*
- `RENDER_DEPLOYMENT_GUIDE.md` - Complete Render deployment
- `ADSTERRA_SETUP_GUIDE.md` - Complete Adsterra setup
