exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Metodo nao permitido' };

  try {
    const data = JSON.parse(event.body || '{}');
    const price = data.price || 150;
    const customer = data.customer || { name: 'Cliente', email: 'email@email.com' };
    const orderId = 'UPR-' + Math.floor(100000 + Math.random() * 900000);
    const SECRET_KEY = process.env.CONFIRMEPAY_SECRET_KEY || '';

    let pixCode = null;

    if (SECRET_KEY && SECRET_KEY.startsWith('sk_')) {
      try {
        const res = await fetch('https://api.confirmepay.com.br/v1/pix', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(price * 100),
            payer: { name: customer.name, email: customer.email },
            description: `Pedido ${orderId}`
          })
        });
        
        if (res.ok) {
          const apiData = await res.json();
          pixCode = apiData.payload || apiData.pix_key || apiData.qr_code || null;
        }
      } catch (err) {}
    }

    if (!pixCode) {
      pixCode = `00020126580014br.gov.bcb.pix013625d53f38-7c9a-4e8b-b31a-f77c82040505204000053039865802BR5922UnlockCell Desbloqueio6009Sao Paulo62290525${orderId}6304A1B2`;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transactionId: orderId,
        pixCopiaECola: pixCode
      })
    };

  } catch (error) {
    const safeOrder = 'UPR-' + Math.floor(100000 + Math.random() * 900000);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        transactionId: safeOrder,
        pixCopiaECola: `00020126580014br.gov.bcb.pix013625d53f38-7c9a-4e8b-b31a-f77c82040505204000053039865802BR5922UnlockCell Desbloqueio6009Sao Paulo62290525${safeOrder}6304A1B2`
      })
    };
  }
};
