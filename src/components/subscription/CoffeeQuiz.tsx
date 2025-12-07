import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Coffee, HelpCircle, Sparkles, Check, Package, Gift, CreditCard, RefreshCw } from "lucide-react";

// Flavor profiles
const flavorProfiles = [
  {
    id: "bold",
    name: "Bold & Dark Roast",
    description: "Rich, full-bodied with chocolate and smoky notes",
    icon: "☕",
    bgClass: "from-amber-900/20 to-stone-900/20",
  },
  {
    id: "bright",
    name: "Bright & Fruity",
    description: "Light roast with citrus, berry, and floral notes",
    icon: "🍊",
    bgClass: "from-orange-500/20 to-yellow-500/20",
  },
  {
    id: "balanced",
    name: "Balanced & Smooth",
    description: "Medium roast with nutty, caramel undertones",
    icon: "🌰",
    bgClass: "from-amber-600/20 to-amber-800/20",
  },
];

// Brew methods with auto-grind mapping
const brewMethods = [
  { id: "espresso", name: "Espresso", icon: "☕", grind: "espresso", description: "Fine grind for espresso machines" },
  { id: "pour_over", name: "Pour Over", icon: "🫖", grind: "pour_over", description: "Medium-fine for clean extraction" },
  { id: "french_press", name: "French Press", icon: "🍵", grind: "french_press", description: "Coarse grind for full immersion" },
  { id: "drip", name: "Drip Machine", icon: "🏠", grind: "drip", description: "Medium grind for automatic brewers" },
  { id: "whole_bean", name: "I Grind My Own", icon: "🫘", grind: "whole_bean", description: "Fresh whole beans for home grinding" },
];

// Bag size options with visual comparison
const bagSizeOptions = [
  { 
    id: "12oz", 
    label: "12 oz", 
    cups: "~24 cups", 
    duration: "1-2 weeks",
    icon: "☕",
    priceLabel: "Standard",
    visual: 1,
  },
  { 
    id: "2lb", 
    label: "2 lb", 
    cups: "~64 cups", 
    duration: "3-4 weeks",
    icon: "☕☕",
    priceLabel: "Best Value",
    visual: 2.5,
  },
  { 
    id: "5lb", 
    label: "5 lb", 
    cups: "~160 cups", 
    duration: "6-8 weeks",
    icon: "☕☕☕",
    priceLabel: "Bulk Savings",
    visual: 5.5,
  },
];

// Quantity/Frequency options
const quantityOptions = [
  { id: "light", bags: 1, frequency: "monthly", label: "1 Bag/Month", description: "Perfect for light drinkers", cupsPerDay: "1-2 cups" },
  { id: "regular", bags: 1, frequency: "biweekly", label: "1 Bag/2 Weeks", description: "For daily coffee lovers", cupsPerDay: "2-3 cups" },
  { id: "heavy", bags: 2, frequency: "biweekly", label: "2 Bags/2 Weeks", description: "For households or heavy drinkers", cupsPerDay: "4+ cups" },
  { id: "office", bags: 2, frequency: "weekly", label: "2 Bags/Week", description: "For small offices", cupsPerDay: "Team supply" },
];

// Grind explanations
const grindExplanations = {
  espresso: {
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&h=200&fit=crop",
    title: "Fine Grind",
    description: "Powdery texture, like table salt. Ideal for espresso machines and Moka pots.",
  },
  pour_over: {
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop",
    title: "Medium-Fine Grind",
    description: "Slightly finer than sand. Perfect for pour-over methods like V60 and Chemex.",
  },
  french_press: {
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop",
    title: "Coarse Grind",
    description: "Chunky texture, like sea salt. Best for French press and cold brew.",
  },
  drip: {
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=200&h=200&fit=crop",
    title: "Medium Grind",
    description: "Sandy texture, like beach sand. Works great with drip coffee makers.",
  },
  whole_bean: {
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&h=200&fit=crop",
    title: "Whole Bean",
    description: "Unground beans for maximum freshness. Grind just before brewing.",
  },
};

// Prepaid options
const prepaidMonthOptions = [
  { value: 3, label: "3 Months", discount: "5% off" },
  { value: 6, label: "6 Months", discount: "10% off", recommended: true },
  { value: 12, label: "12 Months", discount: "15% off" },
];

// Gift duration options
const giftDurationOptions = [
  { value: 1, label: "1 Month" },
  { value: 3, label: "3 Months", popular: true },
  { value: 6, label: "6 Months" },
  { value: 12, label: "12 Months" },
];

interface CoffeeQuizProps {
  onComplete: (selections: {
    flavorProfile: string;
    brewMethod: string;
    grind: string;
    bagSize: string;
    quantity: number;
    frequency: string;
    subscriptionType: "regular" | "prepaid" | "gift";
    prepaidMonths?: number;
    giftDuration?: number;
  }) => void;
  initialValues?: {
    flavorProfile?: string;
    brewMethod?: string;
    bagSize?: string;
    quantity?: number;
    frequency?: string;
    subscriptionType?: "regular" | "prepaid" | "gift";
  };
}

const CoffeeQuiz = ({ onComplete, initialValues }: CoffeeQuizProps) => {
  const [step, setStep] = useState(1);
  const [flavorProfile, setFlavorProfile] = useState(initialValues?.flavorProfile || "");
  const [brewMethod, setBrewMethod] = useState(initialValues?.brewMethod || "");
  const [bagSize, setBagSize] = useState(initialValues?.bagSize || "");
  const [quantityOption, setQuantityOption] = useState("");
  const [showGrindInfo, setShowGrindInfo] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<"regular" | "prepaid" | "gift">(
    initialValues?.subscriptionType || "regular"
  );
  const [prepaidMonths, setPrepaidMonths] = useState(6);
  const [giftDuration, setGiftDuration] = useState(3);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const selectedBrewMethod = brewMethods.find(b => b.id === brewMethod);
  const selectedQuantity = quantityOptions.find(q => q.id === quantityOption);

  useEffect(() => {
    // Auto-complete when all selections are made
    if (flavorProfile && brewMethod && bagSize && quantityOption && selectedQuantity) {
      onComplete({
        flavorProfile,
        brewMethod,
        grind: selectedBrewMethod?.grind || "whole_bean",
        bagSize,
        quantity: selectedQuantity.bags,
        frequency: selectedQuantity.frequency,
        subscriptionType,
        prepaidMonths: subscriptionType === "prepaid" ? prepaidMonths : undefined,
        giftDuration: subscriptionType === "gift" ? giftDuration : undefined,
      });
    }
  }, [flavorProfile, brewMethod, bagSize, quantityOption, subscriptionType, prepaidMonths, giftDuration]);

  const canProceed = () => {
    if (step === 1) return !!flavorProfile;
    if (step === 2) return !!brewMethod;
    if (step === 3) return !!bagSize;
    if (step === 4) return !!quantityOption;
    return false;
  };

  const stepTitles = [
    "Flavor Profile",
    "Brew Method",
    "Bag Size",
    "Quantity & Frequency",
  ];

  return (
    <div className="space-y-8">
      {/* Subscription Type Tabs */}
      <div className="flex justify-center">
        <Tabs value={subscriptionType} onValueChange={(v) => setSubscriptionType(v as typeof subscriptionType)}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="regular" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Regular</span>
            </TabsTrigger>
            <TabsTrigger value="prepaid" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Prepaid</span>
            </TabsTrigger>
            <TabsTrigger value="gift" className="gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Gift</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Subscription Type Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subscriptionType}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="text-center"
        >
          {subscriptionType === "regular" && (
            <p className="text-sm text-muted-foreground">
              Flexible recurring delivery. Pause, skip, or cancel anytime.
            </p>
          )}
          {subscriptionType === "prepaid" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pay upfront and save! Choose your prepaid duration:
              </p>
              <div className="flex justify-center gap-2">
                {prepaidMonthOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={prepaidMonths === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrepaidMonths(option.value)}
                    className="relative"
                  >
                    {option.label}
                    {option.recommended && (
                      <Badge className="absolute -top-2 -right-2 text-[10px] px-1 py-0">Best</Badge>
                    )}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-green-600 font-medium">
                {prepaidMonthOptions.find(o => o.value === prepaidMonths)?.discount}
              </p>
            </div>
          )}
          {subscriptionType === "gift" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Give the gift of great coffee! Choose gift duration:
              </p>
              <div className="flex justify-center gap-2">
                {giftDurationOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={giftDuration === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGiftDuration(option.value)}
                    className="relative"
                  >
                    {option.label}
                    {option.popular && (
                      <Badge className="absolute -top-2 -right-2 text-[10px] px-1 py-0">Popular</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > index + 1
                    ? "bg-primary text-primary-foreground"
                    : step === index + 1
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`hidden md:block text-xs ${step === index + 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {title}
              </span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Quiz Steps */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">How do you like your coffee?</h2>
              <p className="text-muted-foreground">Select your preferred flavor profile</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {flavorProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setFlavorProfile(profile.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left group hover:scale-[1.02] ${
                    flavorProfile === profile.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50 bg-gradient-to-br " + profile.bgClass
                  }`}
                >
                  {flavorProfile === profile.id && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="text-4xl mb-3">{profile.icon}</div>
                  <h3 className="font-bold text-lg mb-1">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">How do you brew at home?</h2>
              <p className="text-muted-foreground">We'll grind your beans perfectly for your method</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {brewMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setBrewMethod(method.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-center group hover:scale-[1.02] ${
                    brewMethod === method.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {brewMethod === method.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="text-3xl mb-2">{method.icon}</div>
                  <h3 className="font-medium text-sm">{method.name}</h3>
                </button>
              ))}
            </div>

            {brewMethod && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 rounded-lg p-4 flex items-center gap-4"
              >
                <TooltipProvider>
                  <Tooltip open={showGrindInfo} onOpenChange={setShowGrindInfo}>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                        onClick={() => setShowGrindInfo(!showGrindInfo)}
                      >
                        <HelpCircle className="h-4 w-4" />
                        What's this grind?
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs p-4">
                      {selectedBrewMethod && grindExplanations[selectedBrewMethod.grind as keyof typeof grindExplanations] && (
                        <div className="space-y-2">
                          <img
                            src={grindExplanations[selectedBrewMethod.grind as keyof typeof grindExplanations].image}
                            alt="Grind size"
                            className="w-full h-24 object-cover rounded"
                          />
                          <h4 className="font-bold">{grindExplanations[selectedBrewMethod.grind as keyof typeof grindExplanations].title}</h4>
                          <p className="text-sm">{grindExplanations[selectedBrewMethod.grind as keyof typeof grindExplanations].description}</p>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex-1">
                  <p className="font-medium">Auto-selected: {selectedBrewMethod?.description}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Choose your bag size</h2>
              <p className="text-muted-foreground">Select the size that fits your coffee needs</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {bagSizeOptions.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setBagSize(size.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-center group hover:scale-[1.02] ${
                    bagSize === size.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {bagSize === size.id && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {size.priceLabel === "Best Value" && (
                    <Badge className="absolute top-3 left-3 bg-primary text-xs">
                      {size.priceLabel}
                    </Badge>
                  )}
                  
                  {/* Visual Size Comparison */}
                  <div className="flex justify-center items-end gap-1 h-20 mb-4">
                    {[...Array(3)].map((_, idx) => (
                      <motion.div
                        key={idx}
                        className={`rounded-t-lg transition-all ${
                          idx < Math.ceil(size.visual)
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                        style={{
                          width: "24px",
                          height: `${20 + (idx + 1) * 20}px`,
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: bagSize === size.id ? 1 : 0.8 }}
                        transition={{ delay: idx * 0.1 }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-xl">{size.label}</h3>
                  </div>
                  
                  <p className="text-sm font-medium text-primary">{size.cups}</p>
                  <p className="text-xs text-muted-foreground mt-1">Lasts {size.duration}</p>
                </button>
              ))}
            </div>

            {/* Size Comparison Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground"
            >
              <HelpCircle className="h-4 w-4 inline mr-2" />
              Larger bags offer better value per cup and stay fresh for weeks when stored properly.
            </motion.div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">How much coffee does your household drink?</h2>
              <p className="text-muted-foreground">We'll set up the perfect delivery schedule</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {quantityOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setQuantityOption(option.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left group hover:scale-[1.02] ${
                    quantityOption === option.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {quantityOption === option.id && (
                    <div className="absolute top-3 right-3">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <Coffee className="h-6 w-6 text-primary" />
                    <h3 className="font-bold text-lg">{option.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    ~{option.cupsPerDay}/day
                  </Badge>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Complete your selection to continue
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeQuiz;
