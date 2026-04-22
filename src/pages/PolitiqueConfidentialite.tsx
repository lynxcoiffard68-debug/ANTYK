import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const PolitiqueConfidentialite = () => (
  <div className="min-h-screen bg-background">
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
      <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
        <Link to="/"><ArrowLeft className="w-6 h-6" /></Link>
      </Button>
      <h1 className="text-2xl font-serif font-bold text-foreground">Politique de confidentialité</h1>
    </header>

    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <p className="text-muted-foreground">Dernière mise à jour : 2 avril 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Responsable du traitement</h2>
        <p className="text-foreground leading-relaxed">
          Le responsable du traitement des données personnelles est l'éditeur du site {APP_NAME}, tel que décrit dans les{" "}
          <Link to="/mentions-legales" className="text-primary hover:underline">Mentions légales</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Données collectées</h2>
        <p className="text-foreground leading-relaxed">Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li><strong>Lors de l'inscription :</strong> adresse email, mot de passe (haché)</li>
          <li><strong>Lors de l'onboarding :</strong> prénom, ville, code postal, tranche d'âge, centres d'intérêt, biographie, photo de profil</li>
          <li><strong>Lors de l'utilisation :</strong> messages échangés, activités créées, demandes d'entraide</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Finalités du traitement</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li>Création et gestion de votre compte utilisateur</li>
          <li>Mise en relation avec d'autres membres proches de chez vous</li>
          <li>Fonctionnement de la messagerie et des discussions de groupe</li>
          <li>Modération et lutte contre les abus</li>
          <li>Amélioration du service</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Base légale</h2>
        <p className="text-foreground leading-relaxed">
          Le traitement de vos données repose sur votre <strong>consentement</strong> (article 6.1.a du RGPD) et sur l'<strong>exécution du contrat</strong> que vous concluez en vous inscrivant (article 6.1.b du RGPD).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Durée de conservation</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li><strong>Données du compte :</strong> conservées tant que le compte est actif, puis supprimées sous 30 jours après la demande de suppression</li>
          <li><strong>Messages :</strong> conservés tant que la conversation est active</li>
          <li><strong>Signalements :</strong> conservés 1 an après résolution</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Partage des données</h2>
        <p className="text-foreground leading-relaxed">
          Vos données ne sont <strong>jamais vendues</strong>. Elles peuvent être partagées avec :
        </p>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li>Notre hébergeur (pour le stockage sécurisé)</li>
          <li>Les autorités compétentes si la loi l'exige</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. Sécurité des données</h2>
        <p className="text-foreground leading-relaxed">
          Vos données sont protégées par chiffrement en transit (TLS/HTTPS) et au repos. Les mots de passe sont hachés avec des algorithmes sécurisés (bcrypt). L'accès aux données est restreint par des politiques de sécurité au niveau de la base de données (Row-Level Security).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">8. Vos droits</h2>
        <p className="text-foreground leading-relaxed">
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :
        </p>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li><strong>Accès :</strong> obtenir une copie de vos données</li>
          <li><strong>Rectification :</strong> corriger des informations inexactes</li>
          <li><strong>Suppression :</strong> demander la suppression de votre compte et de vos données</li>
          <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
          <li><strong>Opposition :</strong> vous opposer à un traitement spécifique</li>
          <li><strong>Retrait du consentement :</strong> à tout moment, sans affecter la licéité du traitement antérieur</li>
        </ul>
        <p className="text-foreground leading-relaxed">
          Pour exercer ces droits : <a href="mailto:dpo@antyk.fr" className="text-primary hover:underline">dpo@antyk.fr</a>
        </p>
        <p className="text-foreground leading-relaxed">
          Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">9. Cookies</h2>
        <p className="text-foreground leading-relaxed">
          Le site utilise uniquement des cookies strictement nécessaires (authentification, session). Aucun cookie publicitaire ou de suivi tiers n'est déposé sans votre consentement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">10. Modifications</h2>
        <p className="text-foreground leading-relaxed">
          Cette politique peut être mise à jour. Toute modification sera communiquée sur cette page avec la date de mise à jour.
        </p>
      </section>
    </main>
  </div>
);

export default PolitiqueConfidentialite;
