import { useState, useEffect } from 'react';
import { Coffee, Sparkles, Users, Heart, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import jebenaImage from '@/assets/jebena-pour.png';

const tutorialSteps = [
  {
    number: 1,
    title: "Set the Mood",
    subtitle: "Coffee Time Is Sacred",
    description: "Find your coziest spot — Light your etan (frankincense), grab your Jebena, and gather your people. Coffee time is sacred — laughter required.",
    icon: Heart,
    tip: "Traditionally, the youngest daughter performs the ceremony"
  },
  {
    number: 2,
    title: "Roast with Rhythm",
    subtitle: "Awaken the Beans",
    description: "Traditionally, you'd roast green beans until your kitchen smells like paradise. But hey — we've got you covered! Pick from our amazing Coffee Habesha selection — roasted to perfection and ready to impress.",
    icon: Sparkles,
    tip: "Wave the roasted beans to share the aroma with guests"
  },
  {
    number: 3,
    title: "Grind & Brew",
    subtitle: "The Traditional Way",
    description: "Add your ground coffee to the Jebena, fill with water, and simmer slowly. When it starts to rise, lift it — let it dance a little — then pour into sini cups with style and confidence.",
    icon: Coffee,
    tip: "Pour from a height to create the perfect crema"
  },
  {
    number: 4,
    title: "The Jebena Magic",
    subtitle: "Three Sacred Rounds",
    description: "Serve with fendisha (popcorn) or kolo, and enjoy three rounds: Abol (Bold & Beautiful), Tona (Smooth & Social), and Baraka (Light & Blessed).",
    icon: Users,
    tip: "Never leave before the third cup — it's bad luck!"
  }
];

export default function AnimatedTutorial() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (activeStep < tutorialSteps.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCompletedSteps(prev => [...prev, activeStep]);
      setTimeout(() => {
        setActiveStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (activeStep > 0 && !isAnimating) {
      setIsAnimating(true);
      setCompletedSteps(prev => prev.filter(s => s !== activeStep - 1));
      setTimeout(() => {
        setActiveStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleStepClick = (index: number) => {
    if (!isAnimating && index !== activeStep) {
      setIsAnimating(true);
      if (index < activeStep) {
        setCompletedSteps(prev => prev.filter(s => s < index));
      } else {
        const stepsToComplete = Array.from({ length: index }, (_, i) => i);
        setCompletedSteps(stepsToComplete);
      }
      setTimeout(() => {
        setActiveStep(index);
        setIsAnimating(false);
      }, 300);
    }
  };

  const currentStep = tutorialSteps[activeStep];
  const StepIcon = currentStep.icon;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-2 mb-12">
        {tutorialSteps.map((step, index) => (
          <button
            key={index}
            onClick={() => handleStepClick(index)}
            className="flex items-center gap-2 group"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                index === activeStep
                  ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg shadow-primary/30"
                  : completedSteps.includes(index)
                  ? "bg-primary/20 text-primary border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {completedSteps.includes(index) ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-bold">{step.number}</span>
              )}
            </div>
            {index < tutorialSteps.length - 1 && (
              <div
                className={cn(
                  "w-8 md:w-16 h-1 rounded-full transition-all duration-500",
                  completedSteps.includes(index) ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Step Content */}
        <div
          className={cn(
            "space-y-6 transition-all duration-300",
            isAnimating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-10 h-10 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Step {currentStep.number} of {tutorialSteps.length}
              </span>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                {currentStep.title}
              </h3>
              <p className="text-lg text-muted-foreground italic">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          <p className="text-lg text-card-foreground/80 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Pro Tip */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-sm">
              <span className="font-semibold text-primary">Pro Tip:</span>{" "}
              <span className="text-muted-foreground">{currentStep.tip}</span>
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrev}
              disabled={activeStep === 0 || isAnimating}
              className="gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleNext}
              disabled={activeStep === tutorialSteps.length - 1 || isAnimating}
              className="gap-2"
            >
              Next Step
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Right: Image */}
        <div
          className={cn(
            "relative transition-all duration-500",
            isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={jebenaImage}
              alt="Traditional Ethiopian Jebena Coffee Pot"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Step indicator overlay */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-background/90 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <StepIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{currentStep.title}</p>
                    <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
