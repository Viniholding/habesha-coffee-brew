// components/orders/trackingSteps.ts
import { Package, Truck, CheckCircle } from "lucide-react";

export const getTrackingSteps = (status: string) => {
  return [
    { label: "Order Placed", icon: Package, completed: true },
    { label: "Processing", icon: Package, completed: status !== "pending" },
    {
      label: "Shipped",
      icon: Truck,
      completed: status === "shipped" || status === "delivered",
    },
    { label: "Delivered", icon: CheckCircle, completed: status === "delivered" },
  ];
};
