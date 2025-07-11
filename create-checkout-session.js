// Este código deve estar no arquivo /api/create-checkout-session.js

// Importa a biblioteca do Stripe. A Vercel a instalará automaticamente.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    // Permite que seu site (e não outros) acesse esta função
    // Em um ambiente de produção real, você pode querer restringir isso para o seu domínio específico.
    // Ex: res.setHeader('Access-Control-Allow-Origin', 'https://seusite.com');
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // O navegador envia uma requisição OPTIONS antes do POST para verificar a permissão (CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
        return;
    }

    try {
        const { name, price, quantity, package_id, user_id } = req.body;

        // Cria a Sessão de Checkout no Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: name,
                        },
                        unit_amount: price, // Preço já deve vir em centavos
                    },
                    quantity: quantity,
                },
            ],
            mode: 'payment',
            // URLs para onde o cliente será redirecionado após o pagamento
            success_url: `${req.headers.origin}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/?payment_canceled=true`,
            // Metadados para sabermos qual reserva atualizar no banco de dados
            metadata: {
                package_id: package_id,
                user_id: user_id,
                slots_booked: quantity
            }
        });

        res.status(200).json({ id: session.id });
    } catch (err) {
        console.error('Stripe Error:', err.message);
        res.status(500).json({ statusCode: 500, message: err.message });
    }
};
