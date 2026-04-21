import { cn, type Message } from '@/lib/utils';

export function ChatBubble({ message }: { message: Message }) {
  return (
    <div className={cn('flex', message.fromMe ? 'justify-end' : 'justify-start')}>
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
