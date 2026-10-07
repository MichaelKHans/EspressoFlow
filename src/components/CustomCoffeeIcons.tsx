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
 * Professional Pour Over Filter Cone / Dripper Vector Line Icon
 * Replaces pour-over emoji with clean barista line-art.
 */
export const DripperIcon: React.FC<CustomIconProps> = ({
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
      {/* V60 / Cone Brewer body */}
      <path d="M3.5 5h17l-5.5 11h-6L3.5 5z" />
      {/* Base resting plate */}
      <path d="M7 19h10" />
      {/* Dripper exit extraction drop */}
      <path d="M12 16v3" />
    </svg>
  );
};
