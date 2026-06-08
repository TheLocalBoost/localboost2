#!/bin/bash
# LocalBoost VPS Setup — Ubuntu 22.04
# Usage : bash setup.sh
set -e

echo "=== LocalBoost VPS Setup ==="

# 1. Node.js 22
echo "→ Installation Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Dépendances Playwright (Chromium headless)
echo "→ Dépendances Chromium..."
sudo apt-get install -y \
  libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
  libpango-1.0-0 libcairo2 libatspi2.0-0 fonts-liberation \
  wget xdg-utils

# 3. PM2 (gestionnaire de processus — relance auto si crash)
echo "→ Installation PM2..."
sudo npm install -g pm2

# 4. Cloner le repo
echo "→ Clonage du repo..."
if [ ! -d "localboost2" ]; then
  git clone https://github.com/TheLocalBoost/localboost2.git
fi
cd localboost2

# 5. Dépendances npm
echo "→ npm install..."
npm install

# 6. Installer Playwright + Chromium
echo "→ Installation Playwright Chromium..."
npx playwright install chromium
npx playwright install-deps chromium

echo ""
echo "=== Setup terminé ! ==="
echo ""
echo "Prochaines étapes :"
echo "  1. Copier les scripts outreach depuis ton PC :"
echo "     scp scripts/outreach/harvest_gmaps.mjs root@<IP>:~/localboost2/scripts/outreach/"
echo "     scp scripts/outreach/scrape_gmaps.mjs  root@<IP>:~/localboost2/scripts/outreach/"
echo "     scp scripts/outreach/post_scrape.mjs   root@<IP>:~/localboost2/scripts/outreach/"
echo "     scp scripts/outreach/merge_serpapi.js  root@<IP>:~/localboost2/scripts/outreach/"
echo "     scp scripts/outreach/send.js           root@<IP>:~/localboost2/scripts/outreach/"
echo "     scp scripts/outreach/.env              root@<IP>:~/localboost2/scripts/outreach/"
echo ""
echo "  2. Puis lancer le scraper :"
echo "     bash scripts/vps/start.sh"
