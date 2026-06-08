// simulate_payment.mjs — Simule un checkout.session.completed pour un email donné
// Usage : node scripts/simulate_payment.mjs email@exemple.com

import { createClient } from "@supabase/supabase-js";
import { Resend }        from "resend";

const EMAIL   = process.argv[2];
if (!EMAIL) { console.error("Usage: node scripts/simulate_payment.mjs email@exemple.com"); process.exit(1); }

const SUPABASE_URL  = "https://gezgemgrfehsxbbkjwuz.supabase.co";
const SERVICE_KEY   = "sb_secret_mSRMkqfgV1teHAy6MAwn3Q_1VOXFbRG";
const APP_URL       = "https://thelocalboost.fr";
const RESEND_KEY    = "re_R568eCuQ_Aebh5jngmHHdeB7yVF5LXR2c";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const resend   = new Resend(RESEND_KEY);

async function run() {
  console.log(`\n🔧 Simulation paiement pour : ${EMAIL}\n`);

  // 1. Trouver ou créer le compte Supabase
  const { data: listData } = await supabase.auth.admin.listUsers();
  let user = listData?.users.find(u => u.email === EMAIL);

  if (user) {
    console.log(`✅ Compte existant trouvé : ${user.id}`);
  } else {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      email_confirm: true,
    });
    if (error) { console.error("❌ Erreur création compte :", error.message); process.exit(1); }
    user = created.user;
    console.log(`✅ Nouveau compte créé : ${user.id}`);
  }

  // 2. Upsert profil avec abonnement actif
  const { error: profileError } = await supabase.from("profiles").upsert({
    id:                     user.id,
    stripe_customer_id:     "sim_cus_test",
    stripe_subscription_id: "sim_sub_test",
    subscription_status:    "active",
    onboarded:              false,
    updated_at:             new Date().toISOString(),
  }, { onConflict: "id" });

  if (profileError) console.warn("⚠️  Profil :", profileError.message);
  else console.log("✅ Profil mis à jour (subscription_status: active)");

  // 3. Incrémenter places fondateur
  const { data: spotsRow } = await supabase
    .from("founder_config").select("value").eq("key", "spots_taken").single();
  if (spotsRow) {
    await supabase.from("founder_config")
      .update({ value: (spotsRow.value) + 1 })
      .eq("key", "spots_taken");
    console.log(`✅ Places fondateur : ${spotsRow.value} → ${spotsRow.value + 1}`);
  }

  // 4. Générer magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type:    "magiclink",
    email:   EMAIL,
    options: { redirectTo: `${APP_URL}/auth/callback?next=${encodeURIComponent('/localboost/setup?welcome=1')}` },
  });
  if (linkError) { console.error("❌ Magic link :", linkError.message); process.exit(1); }

  const magicLink = linkData?.properties?.action_link ?? `${APP_URL}/login`;
  console.log(`✅ Magic link généré`);

  // 5. Envoyer l'email de bienvenue
  const { error: emailError } = await resend.emails.send({
    from:    "LocalBoost <contact@thelocalboost.fr>",
    to:      EMAIL,
    subject: "Votre accès LocalBoost est activé ✓",
    html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
  <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;">Bienvenue sur LocalBoost !</h2>
  <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
    Votre abonnement est actif. Cliquez sur le bouton ci-dessous pour accéder à votre tableau de bord et connecter votre fiche Google.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${magicLink}" style="display:inline-block;background:#2563eb;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
      Accéder à mon tableau de bord →
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:10px 0 0;">Ce lien est valable 24h · Un seul clic suffit</p>
  </div>
  <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 8px;">Une fois connecté, vous pourrez :</p>
  <ul style="color:#374151;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
    <li>Connecter votre fiche Google Business</li>
    <li>Voir votre audit complet et vos priorités</li>
    <li>Activer les réponses automatiques aux avis</li>
  </ul>
  <p style="color:#374151;font-size:14px;margin:0;">Questions ? Répondez directement à cet email.<br>À bientôt,<br><strong>L'équipe LocalBoost</strong></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;">
  <p style="color:#9ca3af;font-size:12px;margin:0;">LocalBoost · contact@thelocalboost.fr</p>
</div>`,
  });

  if (emailError) console.error("❌ Email :", emailError.message);
  else console.log(`✅ Email de bienvenue envoyé → ${EMAIL}`);

  console.log("\n🎉 Simulation terminée — vérifie ta boîte mail.\n");
}

run().catch(e => { console.error("❌", e.message); process.exit(1); });
