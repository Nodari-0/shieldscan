# 🚀 Quick Push to GitHub - Step by Step

Your code is ready! Follow these steps:

---

## ✅ Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and **sign in**
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name:** `shieldscan` (or any name you like)
   - **Description:** `Enterprise-grade security scanning platform`
   - **Visibility:** 
     - ✅ **Public** (to show it off!)
     - OR ⚠️ **Private** (if you want to keep it private)
   - **DO NOT** check "Initialize with README" (you already have one)
4. Click **"Create repository"**

---

## 📤 Step 2: Copy These Commands

After creating the repo, GitHub will show you commands. **OR use these** (replace `YOUR_USERNAME` with your GitHub username):

```powershell
# Add remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/shieldscan.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 🔐 Step 3: Authentication

When you run `git push`, you'll be asked for credentials:

**Option A: Personal Access Token (Recommended)**
1. Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Name it: `ShieldScan Push`
4. Select scopes: ✅ **repo** (full control)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. When pushing, use:
   - **Username:** Your GitHub username
   - **Password:** The token (not your password)

**Option B: GitHub CLI (Easier)**
```powershell
# Install GitHub CLI first: winget install GitHub.cli
gh auth login
git push -u origin main
```

---

## ✅ Step 4: Verify

After pushing, check your GitHub repository - you should see all your files!

Your repository will be at:
`https://github.com/YOUR_USERNAME/shieldscan`

---

## 🎯 Next: Deploy to Vercel

Once on GitHub, you can deploy for FREE:
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your `shieldscan` repository
4. Set **Root Directory** to `client`
5. Deploy!

See `DEPLOYMENT_GUIDE.md` for full details.

---

**Need help?** Check `GITHUB_SETUP.md` for detailed instructions.

