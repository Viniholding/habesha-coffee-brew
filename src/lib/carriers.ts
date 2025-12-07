// Carrier tracking URL configurations - supports any carrier with manual URL override
export type CarrierType = 'USPS' | 'FEDEX' | 'UPS' | 'DHL' | 'ONTRAC' | 'LASERSHIP' | 'AMAZON' | 'ROYAL_MAIL' | 'CANADA_POST' | 'AUSTRALIA_POST' | 'PUROLATOR' | 'OTHER';

export interface CarrierConfig {
  name: string;
  code: string;
  trackingUrl: (trackingNumber: string) => string;
}

// Common carriers with auto-generated tracking URLs
export const carriers: Record<CarrierType, CarrierConfig> = {
  USPS: {
    name: 'USPS',
    code: 'usps',
    trackingUrl: (trackingNumber) => 
      `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
  },
  FEDEX: {
    name: 'FedEx',
    code: 'fedex',
    trackingUrl: (trackingNumber) => 
      `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
  },
  UPS: {
    name: 'UPS',
    code: 'ups',
    trackingUrl: (trackingNumber) => 
      `https://www.ups.com/track?tracknum=${trackingNumber}`,
  },
  DHL: {
    name: 'DHL',
    code: 'dhl',
    trackingUrl: (trackingNumber) => 
      `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
  },
  ONTRAC: {
    name: 'OnTrac',
    code: 'ontrac',
    trackingUrl: (trackingNumber) => 
      `https://www.ontrac.com/tracking/?number=${trackingNumber}`,
  },
  LASERSHIP: {
    name: 'LaserShip',
    code: 'lasership',
    trackingUrl: (trackingNumber) => 
      `https://www.lasership.com/track/${trackingNumber}`,
  },
  AMAZON: {
    name: 'Amazon Logistics',
    code: 'amazon',
    trackingUrl: (trackingNumber) => 
      `https://track.amazon.com/tracking/${trackingNumber}`,
  },
  ROYAL_MAIL: {
    name: 'Royal Mail',
    code: 'royal_mail',
    trackingUrl: (trackingNumber) => 
      `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
  },
  CANADA_POST: {
    name: 'Canada Post',
    code: 'canada_post',
    trackingUrl: (trackingNumber) => 
      `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${trackingNumber}`,
  },
  AUSTRALIA_POST: {
    name: 'Australia Post',
    code: 'australia_post',
    trackingUrl: (trackingNumber) => 
      `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`,
  },
  PUROLATOR: {
    name: 'Purolator',
    code: 'purolator',
    trackingUrl: (trackingNumber) => 
      `https://www.purolator.com/en/shipping/tracker?pins=${trackingNumber}`,
  },
  OTHER: {
    name: 'Other Carrier',
    code: 'other',
    trackingUrl: () => '',
  },
};

// List of common carriers for dropdown
export const carrierOptions = [
  { value: 'USPS', label: 'USPS' },
  { value: 'FEDEX', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' },
  { value: 'DHL', label: 'DHL' },
  { value: 'ONTRAC', label: 'OnTrac' },
  { value: 'LASERSHIP', label: 'LaserShip' },
  { value: 'AMAZON', label: 'Amazon Logistics' },
  { value: 'ROYAL_MAIL', label: 'Royal Mail' },
  { value: 'CANADA_POST', label: 'Canada Post' },
  { value: 'AUSTRALIA_POST', label: 'Australia Post' },
  { value: 'PUROLATOR', label: 'Purolator' },
  { value: 'OTHER', label: 'Other / Local Courier' },
];

// Shipping status options
export const shippingStatusOptions = [
  { value: 'pending', label: 'Pending', description: 'Order placed, awaiting processing' },
  { value: 'processing', label: 'Processing', description: 'Order is being prepared' },
  { value: 'shipped', label: 'Shipped', description: 'Package has been shipped' },
  { value: 'in_transit', label: 'In Transit', description: 'Package is on the way' },
  { value: 'out_for_delivery', label: 'Out for Delivery', description: 'Package is out for delivery' },
  { value: 'delivered', label: 'Delivered', description: 'Package has been delivered' },
  { value: 'failed', label: 'Delivery Failed', description: 'Delivery attempt failed' },
  { value: 'returned', label: 'Returned', description: 'Package returned to sender' },
  { value: 'cancelled', label: 'Cancelled', description: 'Order was cancelled' },
];

/**
 * Generate tracking URL for a given carrier and tracking number
 * Returns the auto-generated URL for known carriers, or null for unknown carriers
 */
export const generateTrackingUrl = (
  carrier: string | null | undefined, 
  trackingNumber: string | null | undefined
): string | null => {
  if (!trackingNumber) return null;
  
  const carrierKey = (carrier?.toUpperCase().replace(/\s+/g, '_') || 'OTHER') as CarrierType;
  const carrierConfig = carriers[carrierKey];
  
  if (!carrierConfig || carrierKey === 'OTHER') {
    return null; // Return null for unknown carriers - admin should provide manual URL
  }
  
  return carrierConfig.trackingUrl(trackingNumber);
};

/**
 * Get tracking URL - uses custom URL if provided, otherwise generates one
 */
export const getCarrierTrackingUrl = (
  carrier: string | null | undefined, 
  trackingNumber: string | null | undefined,
  customTrackingUrl?: string | null
): string | null => {
  // Use custom URL if provided
  if (customTrackingUrl) return customTrackingUrl;
  
  // Otherwise generate one
  return generateTrackingUrl(carrier, trackingNumber);
};

/**
 * Get display name for a carrier
 */
export const getCarrierName = (carrier: string | null | undefined): string => {
  if (!carrier) return 'Unknown Carrier';
  
  const carrierKey = carrier.toUpperCase().replace(/\s+/g, '_') as CarrierType;
  return carriers[carrierKey]?.name || carrier;
};

/**
 * Check if a carrier is known (can auto-generate tracking URL)
 */
export const isKnownCarrier = (carrier: string | null | undefined): boolean => {
  if (!carrier) return false;
  const carrierKey = carrier.toUpperCase().replace(/\s+/g, '_') as CarrierType;
  return carrierKey in carriers && carrierKey !== 'OTHER';
};
