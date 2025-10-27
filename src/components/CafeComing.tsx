import cafeLogo from "@/assets/cafe-logo.jpg";

const CafeComing = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <img 
              src={cafeLogo} 
              alt="Coffee Habesha Café Logo" 
              className="w-64 h-64 object-contain animate-pulse"
            />
          </div>
          <h2 className="text-5xl font-bold mb-6 text-foreground">
            Café Coming Soon
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience authentic Ethiopian coffee culture in our upcoming café. 
            A space where tradition meets modern comfort, bringing the rich heritage 
            of Coffee Habesha to life.
          </p>
          <div className="inline-block bg-primary/10 px-8 py-4 rounded-lg">
            <p className="text-lg font-semibold text-primary">
              Opening 2025 • Stay Tuned
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CafeComing;
