import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const MentionsLegales = () => (
  <div className="min-h-screen bg-background">
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
      <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
        <Link to="/"><ArrowLeft className="w-6 h-6" /></Link>
      </Button>
      <h1 className="text-2xl font-serif font-bold text-foreground">Mentions légales</h1>
    </header>

    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Éditeur du site</h2>
        <p className="text-foreground leading-relaxed">
          Le site <strong>{APP_NAME}</strong> est édité par :<br />
          <strong>[Nom de la société / Nom du responsable]</strong><br />
          Forme juridique : [SAS / SARL / Auto-entrepreneur…]<br />
          Siège social : [Adresse complète]<br />
          SIRET : [Numéro SIRET]<br />
          Directeur de la publication : [Nom du directeur]<br />
          Email : <a href="mailto:contact@antyk.fr" className="text-primary hover:underline">contact@antyk.fr</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Hébergement</h2>
        <p className="text-foreground leading-relaxed">
          Le site est hébergé par :<br />
          <strong>Lovable (GPT Engineer Inc.)</strong><br />
          Adresse : Stockholm, Suède<br />
          Site web : <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">lovable.dev</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Propriété intellectuelle</h2>
        <p className="text-foreground leading-relaxed">
          L'ensemble des contenus présents sur le site {APP_NAME} (textes, images, logos, graphismes, icônes) sont protégés par le droit d'auteur et le droit de la propriété intellectuelle. Toute reproduction, représentation ou diffusion, en tout ou partie, sans autorisation préalable écrite est interdite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Données personnelles</h2>
        <p className="text-foreground leading-relaxed">
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données.
          Pour exercer ces droits, contactez-nous à : <a href="mailto:dpo@antyk.fr" className="text-primary hover:underline">dpo@antyk.fr</a>
        </p>
        <p className="text-foreground leading-relaxed">
          Pour en savoir plus, consultez notre{" "}
          <Link to="/confidentialite" className="text-primary hover:underline font-semibold">Politique de confidentialité</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Cookies</h2>
        <p className="text-foreground leading-relaxed">
          Le site utilise des cookies strictement nécessaires à son fonctionnement (authentification, préférences de session). Aucun cookie publicitaire ou de suivi n'est utilisé sans votre consentement explicite. Vous pouvez gérer vos préférences à tout moment via le bandeau cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Droit applicable</h2>
        <p className="text-foreground leading-relaxed">
          Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.
        </p>
      </section>
    </main>
  </div>
);

export default MentionsLegales;
