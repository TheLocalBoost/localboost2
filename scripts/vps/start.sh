#!/bin/bash
# Lance harvest_gmaps en continu avec PM2
# Usage : bash scripts/vps/start.sh
set -e

cd ~/localboost2

# Arrêter l'ancienne instance si elle tourne
pm2 delete gmaps-harvest 2>/dev/null || true

# Lancer avec 3 workers (adapté à CX21 — 4GB RAM)
pm2 start scripts/outreach/harvest_gmaps.mjs \
  --name gmaps-harvest \
  --interpreter node \
  -- --workers=3

# Sauvegarder pour relance auto au reboot
pm2 save
sudo pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo ""
echo "✅ harvest_gmaps tourne en arrière-plan avec PM2"
echo ""
echo "Commandes utiles :"
echo "  pm2 logs gmaps-harvest     → voir les logs en temps réel"
echo "  pm2 status                 → état du process"
echo "  pm2 restart gmaps-harvest  → redémarrer"
echo "  pm2 stop gmaps-harvest     → arrêter"
