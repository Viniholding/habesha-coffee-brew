import { motion } from "framer-motion";

interface CoffeeBeanSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const CoffeeBeanSpinner = ({ size = "md", className = "" }: CoffeeBeanSpinnerProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${sizeClasses[size]} relative`}
          animate={{
            y: [0, -12, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        >
          {/* Coffee bean SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full"
          >
            {/* Bean body */}
            <motion.ellipse
              cx="12"
              cy="12"
              rx="8"
              ry="10"
              className="fill-primary"
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.15,
              }}
            />
            {/* Center crease */}
            <path
              d="M12 4C10 8 10 16 12 20"
              strokeWidth="1.5"
              className="stroke-primary-foreground/50"
              strokeLinecap="round"
            />
            {/* Highlight */}
            <ellipse
              cx="9"
              cy="8"
              rx="2"
              ry="3"
              className="fill-primary-foreground/20"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

export const CoffeeBeanLoading = ({ message = "Brewing your experience..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <CoffeeBeanSpinner size="lg" />
      <motion.p
        className="text-muted-foreground text-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
};

export default CoffeeBeanSpinner;
