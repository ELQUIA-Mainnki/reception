export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const contactType = formData.get('contact_type') === 'email' ? 'メール' : '電話';
    const contactInfo = formData.get('contact_info');
    const subject = formData.get('subject');
    const content = formData.get('content');
    const extra = formData.get('extra') || 'なし';

    // HTMLメールのレイアウト構築
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
            .email-container { background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
            h2 { color: #333; border-bottom: 2px solid #0070f3; padding-bottom: 10px; }
            table { width: 100%; margin: 20px 0; border-collapse: collapse; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            td:first-child { font-weight: bold; width: 150px; color: #666; }
            .content-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #0070f3; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 0.9rem; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <h2>📩 Webサイトからの問い合わせ</h2>
            <table>
              <tr>
                <td>お名前</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td>連絡先 (${contactType})</td>
                <td>${contactInfo}</td>
              </tr>
              <tr>
                <td>お題</td>
                <td>${subject}</td>
              </tr>
            </table>

            <div class="content-box">
              <p><strong>📝 お問い合わせ内容</strong></p>
              <p>${content.replace(/\n/g, '<br>')}</p>
            </div>

            <div class="content-box">
              <p><strong>💬 その他・備考</strong></p>
              <p>${extra.replace(/\n/g, '<br>')}</p>
            </div>

            <div class="footer">
              送信元: あなたのWebサイトフォーム
            </div>
          </div>
        </body>
      </html>
    `;

    // Resend APIを使ってメール送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: env.TO_EMAIL, // 環境変数から読み込み
        subject: `[Form] ${subject}`,
        html: htmlEmail,
      }),
    });

    if (res.ok) {
      return new Response(JSON.stringify({ success: true }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    } else {
      const errorData = await res.json();
      console.error('Resend Error:', errorData);
      return new Response('Email API Error', { status: 500 });
    }

  } catch (err) {
    console.error('Server Error:', err);
    return new Response('Server Error: ' + err.message, { status: 500 });
  }
}