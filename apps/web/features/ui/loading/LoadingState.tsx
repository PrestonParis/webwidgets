import { cn } from '@/lib/utils/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { LoadingSkeleton } from './LoadingSkeleton';
import { PageLoading } from './PageLoading';
import { WidgetLoading } from './WidgetLoading';
import { TableLoading } from './TableLoading';
import { ListLoading } from './ListLoading';
import { ChartLoading } from './ChartLoading';
import { OverlayLoading } from './OverlayLoading';
import { ButtonLoading } from './ButtonLoading';

type LoadingVariant =
  | 'fullscreen'
  | 'page'
  | 'section'
  | 'card'
  | 'widget'
  | 'inline'
  | 'overlay'
  | 'button'
  | 'table'
  | 'list'
  | 'chart';

type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LoadingTone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'destructive';

interface LoadingStateProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  tone?: LoadingTone;
  message?: string;
  subMessage?: string;
  className?: string;
  spinnerClassName?: string;
  showSpinner?: boolean;
  showSkeleton?: boolean;
  centered?: boolean;
  minHeight?: string;
  rounded?: boolean;
  border?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
  isLoaded?: boolean;
  children?: React.ReactNode;
  // Variant-specific props
  rows?: number;
  columns?: number;
  count?: number;
  compact?: boolean;
  overlay?: boolean;
  blur?: boolean;
  dim?: boolean;
  spinnerOnly?: boolean;
  overlayMode?: 'transparent' | 'dim' | 'blur' | 'solid';
  widgetVariant?: 'compact' | 'standard' | 'large' | 'dense';
  showHeader?: boolean;
  showFooter?: boolean;
  chartVariant?: 'line' | 'bar' | 'area';
  chartHeight?: string;
  barCount?: number;
  showAvatar?: boolean;
  ariaLabel?: string;
}

/**
 * Flexible loading state component supporting multiple variants:
 *
 * @example
 * // Full page loading
 * <LoadingState variant="fullscreen" message="Loading your data..." />
 *
 * @example
 * // Widget loading
 * <LoadingState variant="widget" widgetVariant="standard" />
 *
 * @example
 * // Button loading
 * <LoadingState variant="button" isLoading={isLoading}>Submit</LoadingState>
 *
 * @example
 * // Inline spinner
 * <LoadingState variant="inline" size="sm" />
 *
 * @example
 * // Table loading
 * <LoadingState variant="table" rows={10} columns={4} />
 *
 * @example
 * // Overlay loading
 * <LoadingState variant="overlay" overlayMode="dim" message="Processing..." />
 */
export function LoadingState({
  variant = 'section',
  size = 'md',
  tone = 'default',
  message,
  subMessage,
  className,
  spinnerClassName,
  showSpinner = true,
  showSkeleton = false,
  centered = true,
  minHeight,
  rounded = false,
  border = false,
  icon,
  isLoading = true,
  isLoaded = false,
  children,
  rows = 5,
  columns = 4,
  count = 5,
  compact = false,
  overlay = false,
  blur = false,
  dim = false,
  spinnerOnly = false,
  overlayMode = 'dim',
  widgetVariant = 'standard',
  showHeader = true,
  showFooter = false,
  chartVariant = 'line',
  chartHeight = 'h-64',
  barCount = 8,
  showAvatar = false,
  ariaLabel = 'Loading',
}: LoadingStateProps) {
  // Return content if not loading
  if (!isLoading && (isLoaded || children)) {
    return children;
  }

  // Variant-specific rendering
  if (variant === 'fullscreen') {
    return (
      <PageLoading
        fullscreen
        {...(message !== undefined && { message })}
        {...(subMessage !== undefined && { subMessage })}
      />
    );
  }

  if (variant === 'page') {
    return (
      <PageLoading
        fullscreen={false}
        minHeight={minHeight ?? 'min-h-96'}
        {...(message !== undefined && { message })}
        {...(subMessage !== undefined && { subMessage })}
      />
    );
  }

  const buttonSize = (size === 'lg' || size === 'xl') ? 'md' : size;
  if (variant === 'button') {
    return (
      <ButtonLoading
        isLoading={isLoading}
        spinnerSize={buttonSize}
        spinnerTone={tone}
        spinnerOnly={spinnerOnly}
      >
        {children}
      </ButtonLoading>
    );
  }

  if (variant === 'overlay') {
    return (
      <OverlayLoading
        isLoading={isLoading}
        mode={overlayMode}
        {...(message !== undefined && { message })}
      />
    );
  }

  if (variant === 'table') {
    return (
      <TableLoading
        rows={rows}
        columns={columns}
        showHeader={showHeader}
        {...(className !== undefined && { className })}
      />
    );
  }

  if (variant === 'list') {
    return (
      <ListLoading
        count={count}
        showAvatar={showAvatar}
        density={compact ? 'compact' : 'normal'}
        {...(className !== undefined && { className })}
      />
    );
  }

  if (variant === 'chart') {
    return (
      <ChartLoading
        height={chartHeight}
        barCount={barCount}
        variant={chartVariant}
        {...(className !== undefined && { className })}
      />
    );
  }

  if (variant === 'widget') {
    return (
      <WidgetLoading
        variant={widgetVariant}
        showHeader={showHeader}
        showFooter={showFooter}
        {...(className !== undefined && { className })}
      />
    );
  }

  // Default variants: section, card, inline, etc.
  const defaultMinHeight =
    minHeight ||
    {
      section: 'min-h-64',
      card: 'min-h-40',
      inline: undefined,
    }[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        centered && 'text-center',
        defaultMinHeight,
        rounded && 'rounded-lg',
        border && 'border border-zinc-200 dark:border-zinc-800',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {showSkeleton && !showSpinner ? (
        <LoadingSkeleton
          count={count}
          {...(spinnerClassName !== undefined && { className: spinnerClassName })}
        />
      ) : null}

      {showSpinner && (
        <div className={spinnerClassName}>
          {icon || <LoadingSpinner size={size} tone={tone} ariaLabel={ariaLabel} />}
        </div>
      )}

      {message && (
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {message}
        </p>
      )}

      {subMessage && (
        <p className="text-xs text-zinc-500 dark:text-zinc-500">{subMessage}</p>
      )}
    </div>
  );
}
