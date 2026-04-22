const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
    <div className="text-center px-6">
      <h1 className="text-3xl font-serif font-bold text-foreground mb-2">{title}</h1>
      <p className="text-lg text-muted-foreground">Cette section sera bientôt disponible.</p>
    </div>
  </div>
);

export const Suggestions = () => <PlaceholderPage title="Suggestions" />;
export const Activities = () => <PlaceholderPage title="Activités" />;
export const Messages = () => <PlaceholderPage title="Messages" />;
