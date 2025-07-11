type TemplateProps = {
  name: string;
  content: string;
};

export function HighTechTemplate({ name, content }: TemplateProps) {
  const formattedContent = content
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('-')) {
        return `<p style="font-size: 16px; line-height: 1.6; margin: 0 0 12px 0; display: flex; align-items: flex-start;"><span style="color: #00BFFF; margin-right: 12px; line-height: 1.6;">&rarr;</span><span>${line.substring(line.indexOf('-') + 1).trim()}</span></p>`;
      }
      return `<p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">${line}</p>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          background-color: #0a0a0a;
          font-family: 'Inter', Arial, sans-serif;
          color: #E5E7EB;
          padding: 40px 20px;
          margin: 0;
        }
        .container {
          background-color: #121212;
          border: 1px solid #333;
          border-radius: 12px;
          max-width: 600px;
          margin: 0 auto;
          padding: 32px;
          box-shadow: 0 0 45px rgba(0, 191, 255, 0.2);
        }
        .header {
          font-size: 26px;
          font-weight: bold;
          color: #FFFFFF;
          margin-bottom: 24px;
          border-bottom: 1px solid #00BFFF;
          padding-bottom: 16px;
        }
        .content {
          color: #B0B0B0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(90deg, #007BFF, #00BFFF);
          color: #FFFFFF;
          border-radius: 8px;
          padding: 14px 28px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 24px;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: scale(1.05);
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 32px;
        }
        .footer strong {
            color: #888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">Hello, ${name || 'Valued User'}!</h1>
        <div class="content">
          ${formattedContent}
        </div>
        <a href="https://airbornehrs.in" target="_blank" rel="noopener noreferrer" class="button">
          Post a Job for Free
        </a>
      </div>
      <div class="footer">
        <p><strong>AirborneHRS - Human and Robotics Solutions</strong></p>
        <p>Contact: +91 8266967466</p>
        <p>&copy; ${new Date().getFullYear()} AirborneHRS. All Rights Reserved.</p>
      </div>
    </body>
    </html>
  `;
}
