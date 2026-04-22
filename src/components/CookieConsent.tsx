import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const COOKIE_KEY = "antyk_cookie_consent";

type ConsentValue = "accepted" | "refused" | "custom";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const saveConsent = (value: ConsentValue) => {
    localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border shadow-lg px-6 py-5 md:flex md:items-center md:gap-6 md:justify-between"
    >
      <div className="flex-1 mb-4 md:mb-0">
        <p className="text-foreground font-semibold text-lg mb-1">🍪 Gestion des cookies</p>
        <p className="text-muted-foreground leading-relaxed">
          Ce site utilise uniquement des cookies <strong>strictement nécessaires</strong> à son fonctionnement (authentification, session).
          Aucun cookie publicitaire ou de suivi n'est utilisé.{" "}
          <Link to="/confidentialite" className="text-primary hover:underline">En savoir plus</Link>
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="outline"
          className="min-h-[48px] text-base"
          onClick={() => saveConsent("refused")}
        >
          Refuser les non essentiels
        </Button>
        <Button
          className="min-h-[48px] text-base"
          onClick={() => saveConsent("accepted")}
        >
          Accepter
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;
