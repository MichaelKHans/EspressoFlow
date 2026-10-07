import React from 'react';

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Professional Coffee Bean Vector Line Icon (Lucide 24x24 stroke style)
 * Replaces informal bean emoji with clean artisan line-art.
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
      {/* Stylized oval bean contour */}
      <path d="M18.5 5.5a8.2 8.2 0 0 0-11.6 0c-3.2 3.2-3.2 8.4 0 11.6 3.2 3.2 8.4 3.2 11.6 0 3.2-3.2 3.2-8.4 0-11.6z" />
      {/* Characteristic curved Arabica center fissure */}
      <path d="M6.9 17.1c2.4-0.8 3.8-3.2 5.1-5.1 1.3-1.9 2.7-4.3 5.1-5.1" />
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
