import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Heart, Users, HandHelping } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
          <Link to="/"><ArrowLeft className="w-6 h-6" /></Link>
        </Button>
        <h2 className="text-2xl font-serif font-bold text-primary">{APP_NAME}</h2>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        <section>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">À propos d'{APP_NAME}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {APP_NAME} est né d'un constat simple : trop de personnes se sentent isolées au quotidien.
            Notre mission est de recréer des liens humains, chaleureux et de proximité.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-serif font-bold text-foreground">Nos valeurs</h2>
          {[
            { icon: ShieldCheck, title: "Bienveillance", text: "Chaque interaction est pensée pour être respectueuse et rassurante." },
            { icon: Users, title: "Proximité", text: "Rencontrez des personnes proches de chez vous, pas à l'autre bout du monde." },
            { icon: HandHelping, title: "Entraide", text: "S'entraider au quotidien, c'est aussi tisser des liens durables." },
            { icon: Heart, title: "Authenticité", text: "Pas de faux profils, pas de course aux likes. Juste des êtres humains." },
          ].map((v) => (
            <div key={v.title} className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <v.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-warm-light rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Rejoignez-nous</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Créez votre profil en quelques minutes et commencez à rencontrer des personnes formidables.
          </p>
          <Button className="btn-senior text-lg" asChild>
            <Link to="/inscription">S'inscrire gratuitement</Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default About;
