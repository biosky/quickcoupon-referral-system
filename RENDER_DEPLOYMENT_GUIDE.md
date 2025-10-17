# 🚀 QuickCoupon - Complete Render Deployment Guide

## 📋 Prerequisites

1. **GitHub Account** - Your code should be pushed to a GitHub repository
2. **Render Account** - Sign up at https://render.com (free tier available)
3. **MongoDB Atlas Account** - Sign up at https://www.mongodb.com/cloud/atlas (free tier available)

---

## Part 1: MongoDB Atlas Setup

### Step 1: Create MongoDB Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Log in
3. Click **"Build a Database"**
4. Select **"M0 Free"** tier
5. Choose your preferred **Cloud Provider & Region**
6. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 2: Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `quickcoupon_user`
5. Set password: `[STRONG_PASSWORD]` (Save this!)
6. Set permissions: **"Read and write to any database"**
7. Click **"Add User"**

### Step 3: Whitelist IP Addresses

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://quickcoupon_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add `&ssl=true&ssl_cert_reqs=CERT_NONE` at the end
7. Final format:
   ```
   mongodb+srv://quickcoupon_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE
   ```

---

## Part 2: Backend Deployment on Render

### Step 1: Push Code to GitHub

```bash
cd /path/to/your/app
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Backend Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repository**
4. Configure the service:

   **Basic Settings:**
   - Name: `quickcoupon-backend`
   - Region: Choose closest to you
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port 8001`

   **Advanced Settings:**
   - Instance Type: `Free`

### Step 3: Add Backend Environment Variables

In the **Environment Variables** section, add these:

| Key | Value |
|-----|-------|
| `MONGO_URL` | `mongodb+srv://quickcoupon_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE` |
| `DB_NAME` | `quickcoupon` |
| `JWT_SECRET` | `your_super_secret_jwt_key_12345_change_this` |
| `CORS_ORIGINS` | `*` |
| `PYTHON_VERSION` | `3.11.0` |

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy the backend URL (e.g., `https://quickcoupon-backend.onrender.com`)

---

## Part 3: Frontend Deployment on Render

### Step 1: Create Frontend Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your **GitHub repository**
3. Configure the service:

   **Basic Settings:**
   - Name: `quickcoupon-frontend`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `yarn install && yarn build`
   - Publish Directory: `build`

### Step 2: Add Frontend Environment Variables

In the **Environment Variables** section, add these:

| Key | Value |
|-----|-------|
| `REACT_APP_BACKEND_URL` | `https://quickcoupon-backend.onrender.com` (Use your backend URL from Part 2) |
| `NODE_VERSION` | `18` |
| `REACT_APP_ADS_ENABLED` | `true` |
| `REACT_APP_ADSTERRA_AD_KEY` | `[LEAVE EMPTY FOR NOW - Update after Adsterra setup]` |

### Step 3: Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://quickcoupon-frontend.onrender.com`

---

## Part 4: Update CORS on Backend

### Step 1: Update CORS_ORIGINS

1. Go to your **Backend Web Service** on Render
2. Go to **Environment** tab
3. Update `CORS_ORIGINS` value to your frontend URL:
   ```
   https://quickcoupon-frontend.onrender.com
   ```
4. Save changes and wait for automatic redeploy

---

## Part 5: Custom Domain Setup (Optional)

### For Frontend:

1. Buy a domain (e.g., `quickcoupon.com` from Namecheap, GoDaddy)
2. In Render Dashboard → Frontend Static Site → **Settings** → **Custom Domains**
3. Click **"Add Custom Domain"**
4. Enter: `quickcoupon.com` or `www.quickcoupon.com`
5. Render will show DNS records to add
6. Go to your domain registrar's DNS settings
7. Add the CNAME/A records provided by Render
8. Wait 10-60 minutes for DNS propagation

### For Backend:

1. Add custom domain like `api.quickcoupon.com`
2. Follow same process as frontend
3. Update frontend's `REACT_APP_BACKEND_URL` to `https://api.quickcoupon.com`

---

## Part 6: Verify Deployment

### Test Backend:

```bash
curl https://quickcoupon-backend.onrender.com/
# Should return: {"status":"healthy","message":"QuickCoupon API is running","version":"1.0.0"}

curl https://quickcoupon-backend.onrender.com/api/
# Should return: {"message":"Referral Coupon System API"}
```

### Test Frontend:

1. Open your frontend URL in browser
2. You should see the QuickCoupon login page
3. Try creating an account
4. Test the complete flow

---

## 🎯 Quick Troubleshooting

### Backend Issues:

**Problem:** Service won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Check MongoDB connection string is correct

**Problem:** CORS errors
- Verify `CORS_ORIGINS` includes your frontend URL
- Check no trailing slashes in URLs

### Frontend Issues:

**Problem:** Can't connect to backend
- Verify `REACT_APP_BACKEND_URL` is correct
- Check backend is deployed and running
- Open browser console for error messages

**Problem:** Build fails
- Check `NODE_VERSION` is set to `18`
- Verify all dependencies in `package.json`

---

## 📊 Important Notes

1. **Free Tier Limitations:**
   - Backend sleeps after 15 min of inactivity
   - First request after sleep takes 30-60 seconds
   - 750 hours/month free

2. **Paid Plans:**
   - Starting at $7/month
   - No sleep
   - Better performance
   - SSL included

3. **MongoDB Free Tier:**
   - 512 MB storage
   - Shared cluster
   - Good for starting out

---

## 🔄 Auto-Deploy Setup

1. In Render Dashboard → Service → **Settings**
2. Enable **"Auto-Deploy"**
3. Now every push to your GitHub repo will auto-deploy

---

## ✅ Post-Deployment Checklist

- [ ] Backend URL is accessible
- [ ] Frontend URL is accessible
- [ ] Can create shopkeeper account
- [ ] Can create customer account
- [ ] Can generate coupons
- [ ] WhatsApp sharing works
- [ ] Redemption flow works
- [ ] QR code generation works

---

**Your QuickCoupon app is now LIVE! 🎉**

Next: Set up Adsterra ads (see ADSTERRA_SETUP.md)
