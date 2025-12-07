import { useMemo } from "react";
import { format, addDays } from "date-fns";
import { Calendar, Truck, CheckCircle2 } from "lucide-react";
import { frequencyOptions } from "@/lib/subscriptionProducts";

interface DeliveryCalendarProps {
  frequency: string;
  startDate?: Date;
}

const DeliveryCalendar = ({ frequency, startDate = new Date() }: DeliveryCalendarProps) => {
  const frequencyData = frequencyOptions.find(f => f.value === frequency);
  const daysPerDelivery = frequencyData?.days || 14;

  const deliveryDates = useMemo(() => {
    const dates = [];
    let currentDate = addDays(startDate, 3); // First delivery in 3 days
    
    for (let i = 0; i < 4; i++) {
      dates.push(currentDate);
      currentDate = addDays(currentDate, daysPerDelivery);
    }
    
    return dates;
  }, [frequency, startDate, daysPerDelivery]);

  const firstDelivery = deliveryDates[0];

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="h-4 w-4 text-primary" />
        <span>Your Delivery Schedule</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

        <div className="space-y-4">
          {/* Today marker */}
          <div className="flex items-center gap-4">
            <div className="relative z-10 w-8 h-8 rounded-full bg-muted border-2 border-border flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Today</p>
              <p className="text-xs text-muted-foreground">{format(new Date(), "MMM d, yyyy")}</p>
            </div>
          </div>

          {/* First delivery - highlighted */}
          <div className="flex items-center gap-4">
            <div className="relative z-10 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
            <div className="flex-1 bg-primary/10 rounded-lg p-3 border border-primary/30">
              <p className="font-bold text-sm text-primary">First Delivery</p>
              <p className="text-xs text-muted-foreground">{format(firstDelivery, "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>

          {/* Subsequent deliveries */}
          {deliveryDates.slice(1).map((date, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="relative z-10 w-8 h-8 rounded-full bg-muted border-2 border-primary/30 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary/60" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Delivery {index + 2}</p>
                <p className="text-xs text-muted-foreground">{format(date, "MMM d, yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
        Deliveries continue {frequencyData?.label.toLowerCase()} until you pause or cancel
      </p>
    </div>
  );
};

export default DeliveryCalendar;
