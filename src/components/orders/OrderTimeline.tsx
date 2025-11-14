import { Package, Truck, CheckCircle } from "lucide-react";

interface TrackingStep {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  completed: boolean;
}

const getTrackingSteps = (status: string): TrackingStep[] => [
  { label: "Order Placed", icon: Package, completed: true },
  { label: "Processing", icon: Package, completed: status !== "pending" },
  {
    label: "Shipped",
    icon: Truck,
    completed: status === "shipped" || status === "delivered",
  },
  { label: "Delivered", icon: CheckCircle, completed: status === "delivered" },
];

interface OrderTimelineProps {
  status: string;
}

export const OrderTimeline = ({ status }: OrderTimelineProps) => {
  const steps = getTrackingSteps(status);

  return (
    <div className="relative">
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
      <div className="relative flex justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-center max-w-20">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

