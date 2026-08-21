# 🚀 How to Share ReachInbox with Anyone (3 Easy Methods)

Here are the **3 simplest ways** to share ReachInbox with recruiters, evaluators, or teammates:

---

## ⚡ Method 1: Instant Live Public URL (Zero-Setup for Recipients)

If you already have ReachInbox running locally on your computer (`localhost:3000`), you can give anyone in the world an instant live public URL using **Localtunnel** or **Cloudflare**:

1. Open your terminal in `c:\project_email`.
2. Run this command:
   ```bash
   npx localtunnel --port 3000
   ```
3. It will generate a live HTTPS link (e.g. `https://reachinbox-demo.loca.lt`).
4. **Share this link with anyone!** They can open it on their browser or phone and test the full application immediately.

---

## 💻 Method 2: 1-Click Local Launch (For Teammates / Evaluators)

If someone wants to run ReachInbox on their own machine, they only need your GitHub link:

1. Send them your GitHub repository link:
   `https://github.com/Agratha99/reachinbox.git`

2. Instruct them to run:
   ```bash
   git clone https://github.com/Agratha99/reachinbox.git
   cd reachinbox
   ```

3. **Double-click `start.bat`** (on Windows) OR run:
   ```bash
   npm run setup
   npm run dev
   ```
   *The script automatically installs dependencies, generates Prisma DB models, and opens both Backend (5000) and Frontend (3000).*

---

## 🌐 Method 3: Permanent Cloud Deployment (Render / Vercel)

If you want a 24/7 permanent hosted URL:
1. **Render (Full-Stack 1-Click)**:
   - Go to [Render Dashboard](https://dashboard.render.com/) ➔ New ➔ **Blueprint**.
   - Connect `https://github.com/Agratha99/reachinbox.git`.
   - Render will deploy PostgreSQL, Express API, and Next.js UI automatically using `render.yaml`.

2. **Vercel (Frontend UI)**:
   - Go to [Vercel](https://vercel.com/) ➔ Import Project ➔ Select `frontend`.
