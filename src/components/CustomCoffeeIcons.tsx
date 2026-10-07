import React from 'react';

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Official Flowbean Vector Line Icon (Lucide 24x24 stroke style)
 * Matches the Flowbean master logo: tilted artisan coffee bean with signature central fissure.
 * Clean vector line-art without extraneous flow waves or background trails.
 */
export const CoffeeBeanIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Tilted bean body matching the master logo angle (approx 45°) and plump silhouette */}
      <path d="M5.5 18C3.2 13.5 5 7.5 9.5 4.8C13.8 2.2 18 4.2 19.2 8.5C20.5 13 18.2 18.5 14 20.2C10.5 21.6 7 20.5 5.5 18Z" />
      {/* Characteristic logo curved center fissure connecting apexes */}
      <path d="M5.5 17.8C8.2 15.8 9.5 13.8 12 12C14.5 10.2 15.8 8.2 18.5 6.2" />
    </svg>
  );
};

/**
 * Professional Gooseneck Pour Over Kettle Vector Line Icon (24x24)
 * Authentic specialty coffee barista kettle: tapered boiler, precision gooseneck spout,
 * balanced barista handle, and top lid with knob. Replaces the confusing triangular funnel.
 */
export const PourOverKettleIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Kettle Boiler Body */}
      <path d="M7 19h10l-1.2-8H8.2L7 19z" />
      {/* Lid & Knob */}
      <path d="M8 11h8" />
      <path d="M12 8v3" />
      <path d="M10.5 8h3" />
      {/* Precision Gooseneck Spout (Graceful sweeping curve from lower-left of boiler) */}
      <path d="M7 16.5C4 16.5 2.5 13.5 2.5 9.5c0-1.8 1.2-2.5 2.2-2.5.8 0 1.2.6 1 1.8" />
      {/* Barista Handle on the right */}
      <path d="M15.8 11.5c2.5 0 4.2 1.5 4.2 3.5s-1.7 3.5-3.8 3.5" />
    </svg>
  );
};

/**
 * Professional Pour Over Server / Carafe Container Vector Line Icon (24x24)
 * Chemex / V60 decanter server container: cone brewer on top, glass decanter body below, and handle.
 */
export const PourOverCarafeIcon: React.FC<CustomIconProps> = ({
  size = 20,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top Filter Cone */}
      <path d="M5.5 3.5h13l-3.5 6.5h-6L5.5 3.5z" />
      {/* Collar / Rest Rim */}
      <path d="M8.5 10h7" />
      {/* Glass Carafe / Decanter Body */}
      <path d="M9 10c-2.5 1.5-3.5 3.5-3.5 6.5a2 2 0 0 0 2 2.5h9a2 2 0 0 0 2-2.5c0-3-1-5-3.5-6.5" />
      {/* Carafe Ergonomic Handle */}
      <path d="M16.5 12c1.8 0 3 1.2 3 3s-1.2 3-3 3" />
    </svg>
  );
};

/**
 * DripperIcon defaults to the unmistakable PourOverKettleIcon for seamless backwards compatibility.
 */
export const DripperIcon: React.FC<CustomIconProps> = PourOverKettleIcon;
