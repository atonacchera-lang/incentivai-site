exports.handler = async function(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email, source;
  try {
    const body = JSON.parse(event.body);
    email = body.email;
    source = body.source || 'sito';
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Richiesta non valida' }) };
  }

  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email non valida' }) };
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Configurazione mancante' }) };
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        email: email,
        fields: {
          source: source
        },
        groups: ["181098245774116544"],
        status: 'active'
      })
    });

    const data = await response.json();

    // 200 = nuovo iscritto, 201 = già esistente aggiornato — entrambi ok
    if (response.ok || response.status === 409) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    }

    console.error('MailerLite error:', data);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore iscrizione' })
    };

  } catch (err) {
    console.error('Fetch error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore di rete' })
    };
  }
};
