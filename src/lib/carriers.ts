// Carrier tracking URL configurations
export type CarrierType = 'USPS' | 'FEDEX' | 'UPS' | 'DHL' | 'ONTRAC' | 'LASERSHIP' | 'AMAZON' | 'OTHER';

export interface CarrierConfig {
  name: string;
  trackingUrl: (trackingNumber: string) => string;
  icon?: string;
}

export const carriers: Record<CarrierType, CarrierConfig> = {
  USPS: {
    name: 'USPS',
    trackingUrl: (trackingNumber) => 
      `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
  },
  FEDEX: {
    name: 'FedEx',
    trackingUrl: (trackingNumber) => 
      `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
  },
  UPS: {
    name: 'UPS',
    trackingUrl: (trackingNumber) => 
      `https://www.ups.com/track?tracknum=${trackingNumber}`,
  },
  DHL: {
    name: 'DHL',
    trackingUrl: (trackingNumber) => 
      `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
  },
  ONTRAC: {
    name: 'OnTrac',
    trackingUrl: (trackingNumber) => 
      `https://www.ontrac.com/tracking/?number=${trackingNumber}`,
  },
  LASERSHIP: {
    name: 'LaserShip',
    trackingUrl: (trackingNumber) => 
      `https://www.lasership.com/track/${trackingNumber}`,
  },
  AMAZON: {
    name: 'Amazon Logistics',
    trackingUrl: (trackingNumber) => 
      `https://track.amazon.com/tracking/${trackingNumber}`,
  },
  OTHER: {
    name: 'Carrier',
    trackingUrl: (trackingNumber) => '#',
  },
};

export const getCarrierTrackingUrl = (
  carrier: string | null | undefined, 
  trackingNumber: string | null | undefined
): string | null => {
  if (!trackingNumber) return null;
  
  const carrierKey = (carrier?.toUpperCase() || 'OTHER') as CarrierType;
  const carrierConfig = carriers[carrierKey] || carriers.OTHER;
  
  return carrierConfig.trackingUrl(trackingNumber);
};

export const getCarrierName = (carrier: string | null | undefined): string => {
  const carrierKey = (carrier?.toUpperCase() || 'OTHER') as CarrierType;
  return carriers[carrierKey]?.name || carrier || 'Unknown Carrier';
};
