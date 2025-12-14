import { useState } from 'react';
import { MapPin, Coffee, Mountain, Thermometer, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Region {
  id: string;
  name: string;
  position: { top: string; left: string };
  altitude: string;
  climate: string;
  flavorNotes: string[];
  description: string;
  famousFor: string;
}

const regions: Region[] = [
  {
    id: 'yirgacheffe',
    name: 'Yirgacheffe',
    position: { top: '65%', left: '52%' },
    altitude: '1,700 - 2,200m',
    climate: 'Tropical Highland',
    flavorNotes: ['Floral', 'Citrus', 'Bergamot', 'Jasmine'],
    description: 'The crown jewel of Ethiopian coffee, Yirgacheffe produces some of the world\'s most sought-after beans with exceptional floral and citrus notes.',
    famousFor: 'Bright, tea-like body with intense floral aromatics'
  },
  {
    id: 'sidamo',
    name: 'Sidamo',
    position: { top: '58%', left: '48%' },
    altitude: '1,500 - 2,200m',
    climate: 'Subtropical',
    flavorNotes: ['Berry', 'Wine', 'Chocolate', 'Spice'],
    description: 'A diverse growing region producing complex coffees with wine-like acidity and rich berry undertones.',
    famousFor: 'Complex, wine-like coffees with berry notes'
  },
  {
    id: 'harrar',
    name: 'Harrar',
    position: { top: '35%', left: '72%' },
    altitude: '1,500 - 2,100m',
    climate: 'Semi-arid',
    flavorNotes: ['Blueberry', 'Wine', 'Chocolate', 'Spice'],
    description: 'One of the oldest coffee-producing regions, Harrar is known for its dry-processed beans with bold, fruity character.',
    famousFor: 'Wild, fruity dry-processed coffees'
  },
  {
    id: 'kaffa',
    name: 'Kaffa',
    position: { top: '55%', left: '32%' },
    altitude: '1,400 - 2,000m',
    climate: 'Tropical Rainforest',
    flavorNotes: ['Honey', 'Citrus', 'Floral', 'Herbal'],
    description: 'The legendary birthplace of coffee, where wild Arabica still grows in ancient forest ecosystems.',
    famousFor: 'Origin of coffee — wild forest-grown beans'
  },
  {
    id: 'limu',
    name: 'Limu',
    position: { top: '45%', left: '38%' },
    altitude: '1,400 - 2,100m',
    climate: 'Tropical Highland',
    flavorNotes: ['Wine', 'Spice', 'Floral', 'Citrus'],
    description: 'Known for wet-processed coffees with balanced, wine-like characteristics and medium body.',
    famousFor: 'Well-balanced washed coffees'
  },
  {
    id: 'guji',
    name: 'Guji',
    position: { top: '70%', left: '58%' },
    altitude: '1,800 - 2,300m',
    climate: 'Tropical Highland',
    flavorNotes: ['Peach', 'Jasmine', 'Honey', 'Tropical Fruit'],
    description: 'A rising star in specialty coffee, Guji produces exceptionally sweet and complex coffees with tropical notes.',
    famousFor: 'Sweet, tropical fruit-forward coffees'
  }
];

export default function CoffeeOriginMap() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Map */}
        <div className="lg:col-span-3 relative">
          <div className="relative aspect-[4/5] md:aspect-[4/4] bg-gradient-to-br from-amber-100/50 to-emerald-100/50 dark:from-amber-900/20 dark:to-emerald-900/20 rounded-2xl overflow-hidden border border-border">
            {/* Ethiopia Outline - Simplified SVG shape */}
            <svg 
              viewBox="0 0 400 500" 
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Simplified Ethiopia shape */}
              <path
                d="M80 100 L120 80 L200 70 L280 90 L340 130 L360 200 L380 280 L350 350 L300 400 L240 430 L180 420 L120 380 L80 320 L60 240 L70 160 Z"
                fill="hsl(var(--primary) / 0.1)"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                className="transition-all duration-300"
              />
              
              {/* Coffee growing regions highlight */}
              <ellipse
                cx="200"
                cy="280"
                rx="100"
                ry="120"
                fill="hsl(var(--primary) / 0.15)"
                stroke="hsl(var(--primary) / 0.3)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            </svg>

            {/* Region Labels */}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
              <h4 className="text-sm font-semibold text-foreground">Ethiopia</h4>
              <p className="text-xs text-muted-foreground">Coffee Growing Regions</p>
            </div>

            {/* Region Markers */}
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10",
                  selectedRegion?.id === region.id && "z-20"
                )}
                style={{ top: region.position.top, left: region.position.left }}
              >
                <div className={cn(
                  "relative flex items-center justify-center",
                  (selectedRegion?.id === region.id || hoveredRegion === region.id) && "scale-125"
                )}>
                  {/* Pulse effect */}
                  <span className={cn(
                    "absolute w-8 h-8 rounded-full bg-primary/30 animate-ping",
                    selectedRegion?.id !== region.id && hoveredRegion !== region.id && "hidden"
                  )} />
                  
                  {/* Marker */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                    selectedRegion?.id === region.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground"
                  )}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  
                  {/* Region name tooltip */}
                  <span className={cn(
                    "absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-1 rounded bg-background/90 border border-border shadow-sm transition-opacity duration-200",
                    hoveredRegion === region.id || selectedRegion?.id === region.id ? "opacity-100" : "opacity-0"
                  )}>
                    {region.name}
                  </span>
                </div>
              </button>
            ))}

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-primary/30 border border-primary/50" />
                <span>Coffee Region</span>
              </div>
            </div>
          </div>
        </div>

        {/* Region Details */}
        <div className="lg:col-span-2">
          {selectedRegion ? (
            <div className="bg-card rounded-2xl border border-border p-6 space-y-6 animate-fade-in">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{selectedRegion.name}</h3>
                <p className="text-primary font-medium">{selectedRegion.famousFor}</p>
              </div>

              <p className="text-muted-foreground">{selectedRegion.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mountain className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Altitude</p>
                    <p className="text-sm font-medium text-foreground">{selectedRegion.altitude}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Droplets className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Climate</p>
                    <p className="text-sm font-medium text-foreground">{selectedRegion.climate}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Flavor Notes</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRegion.flavorNotes.map((note) => (
                    <span
                      key={note}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 text-center h-full flex flex-col items-center justify-center">
              <Coffee className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Explore Ethiopia's Coffee Regions</h3>
              <p className="text-muted-foreground text-sm">
                Click on a marker to learn about each region's unique coffee characteristics, altitude, and flavor profiles.
              </p>
            </div>
          )}

          {/* Quick Region List */}
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-foreground mb-3">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                    selectedRegion?.id === region.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
