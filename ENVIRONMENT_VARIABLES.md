# 🔐 Environment Variables Reference

Copy and paste these when setting up on Render!

---

## Backend Environment Variables

```
MONGO_URL=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE

DB_NAME=quickcoupon

JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string

CORS_ORIGINS=https://your-frontend-url.onrender.com

PYTHON_VERSION=3.11.0
```

**Notes:**
- Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your MongoDB credentials
- Replace `cluster0.xxxxx` with your actual cluster address from MongoDB Atlas
- Change `JWT_SECRET` to a random secure string (e.g., use https://randomkeygen.com/)
- Update `CORS_ORIGINS` to your actual frontend URL after deployment

---

## Frontend Environment Variables

```
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com

NODE_VERSION=18

REACT_APP_ADS_ENABLED=true

REACT_APP_ADSTERRA_AD_KEY=YOUR_ADSTERRA_KEY_GOES_HERE
```

**Notes:**
- Replace `your-backend-url` with your actual backend URL from Render
- Leave `REACT_APP_ADSTERRA_AD_KEY` empty initially
- Add your Adsterra key after your website is approved

---

## How to Generate JWT_SECRET

**Option 1:** Use online generator
- Go to https://randomkeygen.com/
- Copy any "Fort Knox Password" or "CodeIgniter Encryption Key"

**Option 2:** Use command line
```bash
openssl rand -base64 32
```

**Option 3:** Use Python
```python
import secrets
print(secrets.token_urlsafe(32))
```

**Example JWT_SECRET:**
```
kJ8mN2pQ5sT7wZ9xC1vB4nM6hG3fD8eR0yU5iO7aS2dF4gH6jK9lZ
```

---

## MongoDB Connection String Builder

**Template:**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER_ADDRESS/DATABASE?OPTIONS
```

**Your Values:**

1. **USERNAME:** `quickcoupon_user` (or your chosen username)
2. **PASSWORD:** `[YOUR_PASSWORD]` (from MongoDB Atlas)
3. **CLUSTER_ADDRESS:** Find this in MongoDB Atlas → Connect → "mongodb+srv://" section
4. **DATABASE:** `quickcoupon` (will be created automatically)
5. **OPTIONS:** `?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE`

**Example Final String:**
```
mongodb+srv://quickcoupon_user:MySecurePass123@cluster0.ab1cd.mongodb.net/?retryWrites=true&w=majority&ssl=true&ssl_cert_reqs=CERT_NONE
```

---

## Where to Find Each Value

### MongoDB Connection Details:
1. Log in to MongoDB Atlas
2. Go to **Database** → Click **Connect** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add SSL parameters at the end

### Backend URL (After Backend Deployment):
- Look in Render Dashboard
- Copy from the top of your backend service page
- Format: `https://your-service-name.onrender.com`

### Frontend URL (After Frontend Deployment):
- Look in Render Dashboard
- Copy from the top of your static site page
- Format: `https://your-site-name.onrender.com`

### Adsterra Ad Key (After Approval):
1. Log in to Adsterra Dashboard
2. Generate ad code
3. Look for the 'key' value in the generated code:
   ```javascript
   atOptions = {
     'key' : 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',  // ← This is your key
     ...
   };
   ```
4. Copy just the key (40 characters)

---

## Quick Copy Template for Render

### For Backend:

| Variable Name | Value to Enter |
|--------------|----------------|
| MONGO_URL | `mongodb+srv://...` |
| DB_NAME | `quickcoupon` |
| JWT_SECRET | `[Generate random string]` |
| CORS_ORIGINS | `*` (update after frontend deployed) |
| PYTHON_VERSION | `3.11.0` |

### For Frontend:

| Variable Name | Value to Enter |
|--------------|----------------|
| REACT_APP_BACKEND_URL | `https://[your-backend].onrender.com` |
| NODE_VERSION | `18` |
| REACT_APP_ADS_ENABLED | `true` |
| REACT_APP_ADSTERRA_AD_KEY | `[Add after Adsterra approval]` |

---

## Testing Your Environment Variables

### Test Backend:
```bash
# Test root endpoint
curl https://your-backend-url.onrender.com/
# Should return: {"status":"healthy","message":"QuickCoupon API is running","version":"1.0.0"}

# Test API endpoint
curl https://your-backend-url.onrender.com/api/
# Should return: {"message":"Referral Coupon System API"}
```

### Test Frontend:
1. Open frontend URL in browser
2. Open Developer Console (F12)
3. Check for any error messages
4. Look for "REACT_APP_BACKEND_URL" in Network tab requests

---

## Common Mistakes to Avoid

❌ **DON'T:**
- Include trailing slashes in URLs (`https://example.com/` ❌)
- Use `http://` instead of `https://`
- Forget to replace `<password>` in MongoDB string
- Use spaces in environment variable values
- Mix up backend and frontend URLs

✅ **DO:**
- Use exact URLs without trailing slashes (`https://example.com` ✅)
- Always use `https://` for production
- Copy MongoDB string exactly as shown
- Trim any extra spaces
- Double-check which URL goes where

---

## Security Notes

🔒 **Keep These Secret:**
- MongoDB username & password
- JWT_SECRET
- Adsterra ad keys
- Never commit these to GitHub

🔒 **Safe to Share:**
- Frontend URL (public)
- Backend URL (public API)

---

## Update Environment Variables Later

**To update any environment variable on Render:**

1. Go to your service in Render Dashboard
2. Click **"Environment"** tab
3. Edit the variable value
4. Click **"Save Changes"**
5. Service will automatically redeploy

---

*Keep this file handy during deployment!*
