import { Heart, Users, HandHelping, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_SLOGAN, APP_DESCRIPTION } from "@/lib/constants";
import { Link } from "react-router-dom";
import logoAntyk from "@/assets/logo-antyk-400.webp";

const values = [
  {
    icon: Users,
    title: "Amitié",
    description: "Rencontrez des personnes bienveillantes qui partagent vos centres d'intérêt.",
  },
  {
    icon: CalendarHeart,
    title: "Activités",
    description: "Participez à des sorties, balades et événements près de chez vous.",
  },
  {
    icon: HandHelping,
    title: "Entraide",
    description: "Donnez et recevez un coup de main pour les petits tracas du quotidien.",
  },
  {
    icon: Heart,
    title: "Amour",
    description: "Et pourquoi pas, laissez la vie vous réserver une belle surprise.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border gap-2">
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <img src={logoAntyk} alt="ANTYK" className="h-8 sm:h-10 w-auto" width={60} height={40} />
        </Link>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" className="min-h-[44px] px-3 sm:px-7 text-base sm:text-lg font-semibold rounded-xl" asChild>
            <Link to="/connexion">Se connecter</Link>
          </Button>
          <Button className="min-h-[44px] px-3 sm:px-7 text-base sm:text-lg font-semibold rounded-xl" asChild>
            <Link to="/inscription">S'inscrire</Link>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main>
      {/* Hero */}
      <section className="px-4 sm:px-6 py-12 md:py-24 text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-6 sm:mb-8 animate-[fadeInScale_0.5s_ease-out_both]">
          <img src={logoAntyk} alt="ANTYK" className="h-16 sm:h-20 md:h-28 w-auto" width={300} height={200} fetchPriority="high" loading="eager" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 sm:mb-6">
          {APP_SLOGAN}
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.15s_both]">
          {APP_DESCRIPTION}
        </p>
        <div className="animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
          <Button size="lg" className="btn-senior text-lg sm:text-xl px-8 sm:px-10 py-4 h-auto" asChild>
            <Link to="/inscription">Rejoindre la communauté</Link>
          </Button>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-warm-light">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-foreground mb-12">
            Ici, on privilégie la bienveillance.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="flex gap-5 items-start bg-background rounded-2xl p-6 shadow-sm border border-border animate-[fadeInUp_0.4s_ease-out_both]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <v.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">{v.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-serif font-bold text-foreground mb-12">
          Comment ça marche ?
        </h2>
        <div className="space-y-8">
          {[
            { step: "1", text: "Inscrivez-vous en quelques minutes et décrivez-vous simplement." },
            { step: "2", text: "Recevez chaque jour quelques suggestions de personnes proches de chez vous." },
            { step: "3", text: "Échangez, participez à des activités ou proposez votre aide." },
          ].map((item, i) => (
            <div
              key={item.step}
              className="flex items-center gap-6 text-left animate-[fadeInLeft_0.4s_ease-out_both]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                {item.step}
              </div>
              <p className="text-lg text-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-nature-light">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Votre sécurité, notre priorité
          </h2>
          <p className="text-lg text-foreground leading-relaxed mb-8">
            Profils vérifiés, système de signalement, conseils de prudence à chaque étape.
            Chez {APP_NAME}, la bienveillance n'est pas une option.
          </p>
          <Button variant="outline" className="btn-senior" asChild>
            <Link to="/a-propos">En savoir plus</Link>
          </Button>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 sm:py-10 border-t border-border text-center space-y-4">
        <nav aria-label="Liens légaux" className="flex flex-wrap justify-center gap-4 text-base">
          <Link to="/mentions-legales" className="text-muted-foreground hover:text-primary hover:underline">Mentions légales</Link>
          <Link to="/confidentialite" className="text-muted-foreground hover:text-primary hover:underline">Confidentialité</Link>
          <Link to="/cgu" className="text-muted-foreground hover:text-primary hover:underline">CGU</Link>
          <Link to="/a-propos" className="text-muted-foreground hover:text-primary hover:underline">À propos</Link>
        </nav>
        <p className="text-muted-foreground">
          © 2026 {APP_NAME} — Fait avec ❤️ pour créer des liens humains.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
