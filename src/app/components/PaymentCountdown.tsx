import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getPaymentTimeRemaining } from '../lib/database.service';
import type { PaymentDocument } from '../lib/database.service';

/**
 * Countdown timer component for pending payments.
 * Shows remaining time before the payment expires (max 30 minutes).
 * Updates every second and shows status when expired.
 */
export function PaymentCountdown({ payment }: { payment: PaymentDocument }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    getPaymentTimeRemaining(payment)
  );

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      const remaining = getPaymentTimeRemaining(payment);
      setSecondsLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  // Not a pending payment
  if (secondsLeft === null) {
    return <span className="text-ev-text-muted text-xs">—</span>;
  }

  // Expired
  if (secondsLeft === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-ev-danger/15 text-ev-danger">
        <Clock className="w-3 h-3" />
        Expired
      </span>
    );
  }

  // Calculate minutes and seconds
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Color coding based on time remaining
  let bgColor = 'bg-ev-success/15';
  let textColor = 'text-ev-success';

  if (secondsLeft <= 300) {
    // Less than 5 minutes: warning color
    bgColor = 'bg-ev-warning/15';
    textColor = 'text-ev-warning';
  }

  if (secondsLeft <= 60) {
    // Less than 1 minute: danger color
    bgColor = 'bg-ev-danger/15';
    textColor = 'text-ev-danger';
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${bgColor} ${textColor}`}>
      <Clock className="w-3 h-3" />
      {minutes}m {seconds.toString().padStart(2, '0')}s
    </span>
  );
}
