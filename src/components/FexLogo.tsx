import React from 'react';

interface FexLogoProps {
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const FexLogo: React.FC<FexLogoProps> = ({
  variant = 'light',
  className = '',
  size = 'md'
}) => {
  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
    xl: 'h-14 sm:h-16'
  };

  // variant 'dark' (used on black/dark surfaces) -> renders official white logo
  // variant 'light' (used on white/light surfaces) -> renders official black logo
  const logoSrc = variant === 'dark' ? '/fex-logo-white.png' : '/fex-logo-dark.png';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Faculdade FEX Educação"
        className={`${heightClasses[size]} w-auto object-contain block`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
