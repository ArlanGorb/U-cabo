import { cn, type Message } from '@/lib/utils';

export function ChatBubble({ message }: { message: Message }) {
  return (
    <div className={cn('flex flex-col', message.fromMe ? 'items-end' : 'items-start', 'mb-4')}>
      {message.senderName && (
        <span className={cn('text-xs mb-1 font-semibold', message.fromMe ? 'text-primary/80 mr-1' : 'text-slate-500 ml-1')}>
          {message.senderName}
        </span>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
          message.fromMe
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md bg-secondary text-secondary-foreground'
        )}
      >
        <p>{message.text}</p>
        <p className={cn('mt-1 text-[10px]', message.fromMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {message.time}
        </p>
      </div>
    </div>
  );
}
