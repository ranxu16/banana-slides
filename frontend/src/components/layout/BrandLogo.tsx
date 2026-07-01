interface BrandLogoProps {
  compact?: boolean;
  className?: string;
  iconClassName?: string;
}

export function BrandLogo({ compact = false, className = '', iconClassName = '' }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/pv-smartdeck-icon-256.png"
        alt="光伏智呈 Logo"
        className={`h-9 w-9 rounded-lg object-cover shadow-sm ${iconClassName}`}
      />
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-semibold text-gray-900">光伏智呈</div>
          <div className="text-[11px] text-gray-500">PV SmartDeck</div>
        </div>
      )}
    </div>
  );
}
