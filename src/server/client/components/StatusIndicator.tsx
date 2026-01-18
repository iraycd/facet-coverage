/** @jsxImportSource preact */
interface StatusIndicatorProps {
  status: 'connected' | 'updating' | 'error' | null;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  if (!status) return null;

  const config = {
    connected: {
      text: 'Connected',
      bgClass: 'bg-green-500/20 border-green-500/50',
      textClass: 'text-green-400',
    },
    updating: {
      text: 'Updating...',
      bgClass: 'bg-yellow-500/20 border-yellow-500/50',
      textClass: 'text-yellow-400',
    },
    error: {
      text: 'Connection error',
      bgClass: 'bg-red-500/20 border-red-500/50',
      textClass: 'text-red-400',
    },
  };

  const { text, bgClass, textClass } = config[status];

  return (
    <div class={`fixed bottom-4 right-4 px-4 py-2 rounded-lg border ${bgClass} flex items-center gap-2`}>
      {status === 'updating' && (
        <div class="w-4 h-4 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
      )}
      <span class={`text-sm ${textClass}`}>{text}</span>
    </div>
  );
}
