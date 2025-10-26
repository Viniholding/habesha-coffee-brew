import { Card } from "@/components/ui/card";
import forestImage from "@/assets/forest.jpg";
import handPickedImage from "@/assets/hand-picked.jpg";
import roastedImage from "@/assets/roasted.jpg";

const processSteps = [
  {
    number: "01",
    title: "Forest Shielded",
    description: "Our premium Arabica beans grow naturally in Ethiopia's lush, protected forest highlands, where the perfect climate creates exceptional flavor.",
    image: forestImage,
  },
  {
    number: "02",
    title: "Hand Picked",
    description: "Each cherry is carefully selected by experienced farmers who harvest only the ripest beans, ensuring superior quality in every batch.",
    image: handPickedImage,
  },
  {
    number: "03",
    title: "Slow Roasted",
    description: "We roast in small batches using traditional methods, allowing each bean to develop its full, complex flavor profile and aroma.",
    image: roastedImage,
  },
];

const Process = () => {
  return (
    <section id="process" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold">Our Process</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From Ethiopian highlands to your cup, we ensure every step delivers perfection
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {processSteps.map((step, index) => (
            <Card 
              key={index}
              className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] group"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-2xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
