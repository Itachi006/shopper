import api from '../api.js';

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(s);
  });
}

/**
 * Pays for an ONLINE order that is in PENDING_PAYMENT.
 * Resolves with the updated order when payment succeeds, rejects if the user closes the popup or it fails.
 */
export async function payForOrder(order, user) {
  const { data: p } = await api.post(`/payments/create/${order.id}`);

  // DEMO mode (backend has no Razorpay keys): confirm in the browser, then verify on the server
  if (p.demo) {
    const ok = window.confirm(
      `DEMO PAYMENT\n\nPay ₹${(p.amount / 100).toFixed(2)} for order #${order.id}?\n\n(No real money is charged. Add Razorpay test keys on the backend to use the real gateway.)`
    );
    if (!ok) throw new Error('Payment cancelled');
    return (await api.post('/payments/verify', { orderId: order.id })).data;
  }

  // REAL Razorpay checkout popup
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: p.keyId,
      amount: p.amount,
      currency: p.currency,
      name: 'ShopEasy',
      description: `Order #${order.id}`,
      order_id: p.razorpayOrderId,
      prefill: { name: user?.name, email: user?.email, contact: order.shipPhone },
      theme: { color: '#4f46e5' },
      handler: async (resp) => {
        try {
          const { data } = await api.post('/payments/verify', {
            orderId: order.id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
          });
          resolve(data);
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rzp.open();
  });
}
