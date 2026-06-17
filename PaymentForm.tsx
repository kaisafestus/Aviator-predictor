'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Assuming App Router
import { createClient } from '@supabase/supabase-js'; // For client-side Supabase Realtime

// Initialize client-side Supabase for Realtime (using NEXT_PUBLIC keys)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
}

interface PaymentFormProps {
  packages: Package[]; // Pass available packages from a server component or fetch client-side
}

export default function PaymentForm({ packages }: PaymentFormProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(packages[0]?.id || '');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const router = useRouter();

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const selectedPackage = packages.find(p => p.id === selectedPackageId);
    if (!selectedPackage) {
      setError('Please select a valid package.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      setMessage(data.message || 'Payment initiated. Please complete the STK push on your phone.');
      setCurrentPaymentId(data.paymentId);

      // Optional: Listen for real-time updates on payment status
      if (data.paymentId) {
        const channel = supabase.channel(`payment_status_${data.paymentId}`);
        channel
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'payments',
              filter: `id=eq.${data.paymentId}`,
            },
            (payload) => {
              const newStatus = (payload.new as any).status;
              if (newStatus === 'paid') {
                setMessage('Payment successful! Redirecting...');
                channel.unsubscribe();
                // Redirect or update UI after successful payment
                router.push('/dashboard?payment_success=true');
              } else if (newStatus === 'failed' || newStatus === 'cancelled') {
                setError(`Payment ${newStatus}. Please try again.`);
                channel.unsubscribe();
              }
            }
          )
          .subscribe();
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Make a Payment</h2>
      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number (e.g., 0712345678)
          </label>
          <input
            type="tel"
            id="phone"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            pattern="07\d{8}"
            placeholder="07xxxxxxxx"
          />
        </div>

        <div>
          <label htmlFor="package" className="block text-sm font-medium text-gray-700">
            Select Package
          </label>
          <select
            id="package"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            required
          >
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} - KES {pkg.price} ({pkg.duration_days} days)
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>

      {message && <p className="mt-4 text-green-600 text-sm">{message}</p>}
      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {currentPaymentId && (
        <p className="mt-2 text-xs text-gray-500">
          Payment ID: {currentPaymentId} (Waiting for confirmation...)
        </p>
      )}
    </div>
  );
}