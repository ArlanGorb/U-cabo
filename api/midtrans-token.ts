import Midtrans from 'midtrans-client';

export default async function handler(req, res) {
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Menyiapkan konfigurasi Midtrans
  // Gunakan variabel MIDTRANS_SERVER_KEY yang ada di Vercel/Environment
  const snap = new Midtrans.Snap({
    isProduction: false, // Ubah ke true jika sudah live production
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY
  });

  try {
    const { order_id, gross_amount, customer_details, item_details } = req.body;

    // Parameter transaksi yang akan dikirim ke API Midtrans
    const parameter = {
      transaction_details: {
        order_id: order_id || 'ORDER-' + Math.floor(Math.random() * 1000000),
        gross_amount: gross_amount
      },
      customer_details: customer_details,
      item_details: item_details
    };

    // Meminta token transaksi kepada Midtrans
    const transaction = await snap.createTransaction(parameter);

    // Mengembalikan token ke frontend React/Vite
    return res.status(200).json({ token: transaction.token, redirect_url: transaction.redirect_url });

  } catch (error) {
    console.error('Midtrans Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
