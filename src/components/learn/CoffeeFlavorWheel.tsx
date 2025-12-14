import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FlavorSegment {
  name: string;
  color: string;
  subFlavors: string[];
}

const flavorCategories: FlavorSegment[] = [
  {
    name: "Fruity",
    color: "hsl(var(--primary))",
    subFlavors: ["Berry", "Citrus", "Stone Fruit", "Tropical"]
  },
  {
    name: "Floral",
    color: "hsl(330 70% 50%)",
    subFlavors: ["Jasmine", "Rose", "Lavender", "Hibiscus"]
  },
  {
    name: "Sweet",
    color: "hsl(45 90% 50%)",
    subFlavors: ["Honey", "Caramel", "Brown Sugar", "Molasses"]
  },
  {
    name: "Nutty",
    color: "hsl(30 60% 45%)",
    subFlavors: ["Almond", "Hazelnut", "Peanut", "Walnut"]
  },
  {
    name: "Chocolate",
    color: "hsl(20 50% 30%)",
    subFlavors: ["Dark Chocolate", "Milk Chocolate", "Cocoa", "Cacao Nibs"]
  },
  {
    name: "Spicy",
    color: "hsl(10 70% 45%)",
    subFlavors: ["Cinnamon", "Clove", "Cardamom", "Black Pepper"]
  },
  {
    name: "Earthy",
    color: "hsl(80 40% 35%)",
    subFlavors: ["Tobacco", "Cedar", "Leather", "Mushroom"]
  },
  {
    name: "Wine-like",
    color: "hsl(340 60% 40%)",
    subFlavors: ["Red Wine", "Fermented", "Winey", "Port"]
  }
];

export default function CoffeeFlavorWheel() {
  const [activeSegment, setActiveSegment] = useState<FlavorSegment | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const segmentCount = flavorCategories.length;
  const segmentAngle = 360 / segmentCount;
  const radius = 150;
  const innerRadius = 60;
  const centerX = 200;
  const centerY = 200;

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  const describeArc = (cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) => {
    const start1 = polarToCartesian(cx, cy, outerR, startAngle);
    const end1 = polarToCartesian(cx, cy, outerR, endAngle);
    const start2 = polarToCartesian(cx, cy, innerR, endAngle);
    const end2 = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      "M", start1.x, start1.y,
      "A", outerR, outerR, 0, largeArc, 1, end1.x, end1.y,
      "L", start2.x, start2.y,
      "A", innerR, innerR, 0, largeArc, 0, end2.x, end2.y,
      "Z"
    ].join(" ");
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
      {/* Wheel */}
      <div className="relative">
        <svg 
          viewBox="0 0 400 400" 
          className="w-80 h-80 md:w-96 md:h-96 drop-shadow-xl"
        >
          {/* Background circle */}
          <circle cx={centerX} cy={centerY} r={radius + 20} fill="hsl(var(--card))" />
          
          {/* Segments */}
          {flavorCategories.map((segment, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;
            const isHovered = hoveredSegment === segment.name;
            const isActive = activeSegment?.name === segment.name;
            
            return (
              <g key={segment.name}>
                <path
                  d={describeArc(centerX, centerY, innerRadius, radius, startAngle, endAngle)}
                  fill={segment.color}
                  stroke="hsl(var(--background))"
                  strokeWidth="2"
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    (isHovered || isActive) && "opacity-100",
                    !isHovered && !isActive && activeSegment && "opacity-50"
                  )}
                  style={{
                    transform: isHovered || isActive ? `scale(1.05)` : 'scale(1)',
                    transformOrigin: `${centerX}px ${centerY}px`
                  }}
                  onMouseEnter={() => setHoveredSegment(segment.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => setActiveSegment(activeSegment?.name === segment.name ? null : segment)}
                />
                {/* Label */}
                {(() => {
                  const labelAngle = startAngle + segmentAngle / 2;
                  const labelRadius = (innerRadius + radius) / 2;
                  const pos = polarToCartesian(centerX, centerY, labelRadius, labelAngle);
                  return (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {segment.name}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Center circle */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={innerRadius - 5} 
            fill="hsl(var(--background))" 
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize="12"
            fontWeight="700"
          >
            COFFEE
          </text>
          <text
            x={centerX}
            y={centerY + 8}
            textAnchor="middle"
            fill="hsl(var(--primary))"
            fontSize="10"
            fontWeight="600"
          >
            FLAVORS
          </text>
        </svg>

        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-4 rounded-full border border-primary/20 animate-pulse" />
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex-1 max-w-md">
        {activeSegment ? (
          <div className="animate-fade-in space-y-6">
            <div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white mb-4"
                style={{ backgroundColor: activeSegment.color }}
              >
                <span className="font-semibold">{activeSegment.name}</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {activeSegment.name} Notes
              </h3>
              <p className="text-muted-foreground mt-2">
                Discover the {activeSegment.name.toLowerCase()} flavor profiles found in Ethiopian coffee varieties.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {activeSegment.subFlavors.map((flavor, idx) => (
                <div
                  key={flavor}
                  className="p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-default"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full mb-2"
                    style={{ backgroundColor: activeSegment.color }}
                  />
                  <p className="font-medium text-foreground">{flavor}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground italic">
              Click another segment to explore more flavors, or click the same segment to deselect.
            </p>
          </div>
        ) : (
          <div className="text-center lg:text-left space-y-4">
            <h3 className="text-3xl font-bold text-foreground">
              Explore Coffee Flavors
            </h3>
            <p className="text-lg text-muted-foreground">
              Click on any segment of the flavor wheel to discover the unique taste profiles found in Ethiopian coffee. From bright fruity notes to deep chocolate undertones, every cup tells a story.
            </p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {flavorCategories.map((segment) => (
                <button
                  key={segment.name}
                  onClick={() => setActiveSegment(segment)}
                  className="px-3 py-1 rounded-full text-sm text-white transition-transform hover:scale-105"
                  style={{ backgroundColor: segment.color }}
                >
                  {segment.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
