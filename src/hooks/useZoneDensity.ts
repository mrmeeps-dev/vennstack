export interface ZoneDensity {
  scale: number;
  negativeMargin: string;
  stacking: boolean;
  gap: string;
  fontSize: string;
}

export function useZoneDensity(itemCount: number, _zoneHeight?: number): ZoneDensity {
  if (itemCount <= 5) {
    return { 
      scale: 1.0, 
      negativeMargin: '0px', 
      stacking: false, 
      gap: 'gap-2', 
      fontSize: 'text-sm' 
    };
  } else if (itemCount <= 12) {
    return { 
      scale: 1.0, 
      negativeMargin: '-4px', 
      stacking: false, 
      gap: 'gap-1', 
      fontSize: 'text-xs' 
    };
  } else if (itemCount <= 16) {
    return { 
      scale: 1.0, 
      negativeMargin: '-12px', 
      stacking: true, 
      gap: 'gap-0.5', 
      fontSize: 'text-xs' 
    };
  } else {
    return { 
      scale: 1.0, 
      negativeMargin: '-20px', 
      stacking: true, 
      gap: 'gap-0.5', 
      fontSize: 'text-xs' 
    };
  }
}

