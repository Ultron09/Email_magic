type TemplateProps = {
  name: string;
  content: string;
};

export function HighTechTemplate({ name, content }: TemplateProps) {
  const formattedContent = content
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('-')) {
        return `<p style="font-size: 16px; line-height: 1.6; margin: 0 0 12px 0; display: flex; align-items: flex-start;"><span style="color: #A63A3A; margin-right: 12px; line-height: 1.6;">&rarr;</span><span>${line.substring(line.indexOf('-') + 1).trim()}</span></p>`;
      }
      return `<p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">${line}</p>`;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        body {
          background-color: #000000;
          font-family: 'Inter', Arial, sans-serif;
          color: #FFFFFF;
          padding: 40px 20px;
          margin: 0;
        }
        .container {
          background-color: #0a0a0a;
          border: 1px solid #333;
          border-radius: 12px;
          max-width: 600px;
          margin: 0 auto;
          padding: 32px;
          box-shadow: 0 0 40px rgba(128, 0, 0, 0.6), 0 0 60px rgba(0, 191, 255, 0.3);
        }
        .header {
          font-size: 26px;
          font-weight: bold;
          color: #FFFFFF;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid;
          border-image: linear-gradient(to right, #800000, #A63A3A, #00BFFF) 1;
          background: linear-gradient(to right, #800000, #A63A3A, #00BFFF);
          background-size: 200% 200%;
          animation: gradient-animation 5s ease infinite;
          text-shadow: 0 0 3px rgba(255, 255, 255, 0.2), 0 0 8px rgba(128, 0, 0, 0.4);
        }
        .content {
          color: #E0E0E0;
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.1);
        }
        .button {
          display: inline-block;
          background: linear-gradient(90deg, #800000, #A63A3A);
          color: #FFFFFF;
          border-radius: 8px;
          padding: 14px 28px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 15px rgba(166, 58, 58, 0.5);
        }
        .button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(166, 58, 58, 0.8);
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
