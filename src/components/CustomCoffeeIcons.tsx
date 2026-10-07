import React from 'react';

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Official Flowbean Vector Line Icon (Lucide 24x24 stroke style)
 * Directly matches the Flowbean master logo: artisan coffee bean with dynamic flow wave.
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
      {/* Tilted bean body matching the master logo angle */}
      <path d="M4.5 14.5C3.2 10.5 5 6.5 9 4.8C12.5 3.3 15.5 5.5 15 9.5C14.5 13 11.5 15.8 8 16.2C6.5 16.3 5.2 15.8 4.5 14.5Z" />
      {/* Characteristic logo curved center fissure */}
      <path d="M9 4.8C7.8 8.5 7.2 11.8 4.5 14.5" />
      {/* Signature aerodynamic flow wave trail swooping under the bean */}
      <path d="M6.5 17C9 19.5 13.5 19.5 16.5 17C18.8 15 19.8 12.2 20.5 9" />
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
