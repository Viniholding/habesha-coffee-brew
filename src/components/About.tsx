const About = () => {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold">
              Coffee by <span className="text-primary">Coffee Habesha</span>
            </h2>
            <div className="h-1 w-32 bg-primary mx-auto rounded-full" />
          </div>
          
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p className="text-xl text-center">
              To achieve our unique and famous signature <strong className="text-foreground">Coffee Habesha</strong>, 
              we only use premium Arabica beans, and our coffee beans are single sourced and hand-crafted 
              in small batches to ensure the highest quality.
            </p>
            
            <p>
              Coffee Habesha is both a necessity and a treat all at the same time, delivering pleasure 
              and purpose all in one delicious, decadent, delightful drink. Ethiopian coffee beans are 
              known for being the best coffee in the world. Ethiopian coffee is elegant and has smooth flavor.
            </p>
            
            <p>
              We manage all our milling, processing, and roasting to maximize texture and flavor profile 
              of all our coffee beans. Each sample is cupped (tasted) and graded by a Master Taster to 
              ensure it meets our high standards worthy of the Habesha name.
            </p>
            
            <p className="text-center text-xl pt-4">
              We are honored and proud to share Coffee Habesha with the world. We are sure you will be 
              hooked on the sweet smell and delicate flavor that will excite your taste buds and ensure 
              a satisfied feeling from the first to the last sip.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground mt-2">Premium Arabica</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">Single</div>
              <div className="text-sm text-muted-foreground mt-2">Source Origin</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">Small</div>
              <div className="text-sm text-muted-foreground mt-2">Batch Roasted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">Expert</div>
              <div className="text-sm text-muted-foreground mt-2">Master Tasted</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
