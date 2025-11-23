import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState('loading');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function delayedRedirect() {
      return setTimeout(() => {
        // ✅ Redirect to workspace settings billing tab instead of /account
        navigate('/workspace/settings?tab=billing');
      }, 4000);
    }

    const queryParams = new URLSearchParams(location.search);
    const isSuccess = queryParams.get('success');
    const isCanceled = queryParams.get('canceled');

    if (isCanceled) {
      setPaymentStatus('canceled');
    } else if (isSuccess) {
      setPaymentStatus('paid');
    } else {
      // ✅ Also redirect to workspace settings if no status
      navigate('/workspace/settings?tab=billing');
    }
    delayedRedirect();
    return () => {
      clearTimeout(delayedRedirect());
    };
  }, [location]);

  return (
    <div className='flex min-h-full flex-col justify-center w-full px-8 py-10'>
      <div className='mx-auto w-full max-w-2xl'>
        <div className='py-8 px-6 shadow-xl ring-1 ring-gray-900/10 dark:ring-gray-100/10 rounded-lg'>
          <h1>
            {paymentStatus === 'paid'
              ? '🥳 Payment Successful!'
              : paymentStatus === 'canceled'
                ? '😢 Payment Canceled'
                : paymentStatus === 'error' && '🙄 Payment Error'}
          </h1>
          {paymentStatus !== 'loading' && (
            <span className='text-center'>
              You are being redirected to your workspace settings... <br />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
