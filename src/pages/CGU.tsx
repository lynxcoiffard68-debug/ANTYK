import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const CGU = () => (
  <div className="min-h-screen bg-background">
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
      <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
        <Link to="/"><ArrowLeft className="w-6 h-6" /></Link>
      </Button>
      <h1 className="text-2xl font-serif font-bold text-foreground">Conditions générales d'utilisation</h1>
    </header>

    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <p className="text-muted-foreground">Dernière mise à jour : 2 avril 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Objet</h2>
        <p className="text-foreground leading-relaxed">
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site {APP_NAME}, une plateforme de mise en relation bienveillante destinée aux personnes de 60 ans et plus.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Inscription</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li>L'inscription est gratuite et ouverte à toute personne physique majeure.</li>
          <li>Vous devez fournir des informations exactes et à jour.</li>
          <li>Vous êtes responsable de la confidentialité de vos identifiants de connexion.</li>
          <li>Un seul compte par personne est autorisé.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Utilisation du service</h2>
        <p className="text-foreground leading-relaxed">En utilisant {APP_NAME}, vous vous engagez à :</p>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li>Respecter les autres membres et adopter un comportement bienveillant</li>
          <li>Ne pas publier de contenus illicites, haineux, discriminatoires ou pornographiques</li>
          <li>Ne pas usurper l'identité d'une autre personne</li>
          <li>Ne pas utiliser le service à des fins commerciales, publicitaires ou frauduleuses</li>
          <li>Ne pas envoyer de messages sollicitant de l'argent ou des données personnelles sensibles</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Modération et signalement</h2>
        <p className="text-foreground leading-relaxed">
          {APP_NAME} dispose d'un système de signalement permettant de signaler tout comportement inapproprié. L'équipe de modération peut suspendre ou supprimer un compte en cas de non-respect des présentes CGU, sans préavis.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Propriété intellectuelle</h2>
        <p className="text-foreground leading-relaxed">
          Les contenus que vous publiez (textes, photos) restent votre propriété. En les publiant sur {APP_NAME}, vous accordez une licence non exclusive et gratuite pour leur affichage dans le cadre du service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Responsabilité</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground">
          <li>{APP_NAME} ne peut être tenu responsable des propos ou comportements de ses membres.</li>
          <li>{APP_NAME} ne garantit pas la compatibilité entre les membres.</li>
          <li>Le service est fourni « en l'état », sans garantie de disponibilité permanente.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. Données personnelles</h2>
        <p className="text-foreground leading-relaxed">
          Vos données sont traitées conformément à notre{" "}
          <Link to="/confidentialite" className="text-primary hover:underline font-semibold">Politique de confidentialité</Link> et au RGPD.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">8. Résiliation</h2>
        <p className="text-foreground leading-relaxed">
          Vous pouvez supprimer votre compte à tout moment depuis votre profil. La suppression entraîne l'effacement de vos données personnelles sous 30 jours.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">9. Modifications des CGU</h2>
        <p className="text-foreground leading-relaxed">
          {APP_NAME} se réserve le droit de modifier les présentes CGU. Toute modification sera communiquée aux utilisateurs et prendra effet après publication sur cette page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">10. Droit applicable</h2>
        <p className="text-foreground leading-relaxed">
          Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents de [Ville].
        </p>
      </section>
    </main>
  </div>
);

export default CGU;
