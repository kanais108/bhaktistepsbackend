import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class PublicController {
  @Get('support')
  @Header('Content-Type', 'text/html')
  supportPage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bhakti Steps Support</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 18px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }
    h1 {
      color: #2f6fed;
      margin-top: 0;
    }
    h2 {
      margin-top: 28px;
      color: #1e293b;
    }
    a {
      color: #2f6fed;
    }
    .footer {
      margin-top: 32px;
      font-size: 14px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <main class="container">
    <section class="card">
      <h1>Bhakti Steps Support</h1>

      <p>
        Thank you for using Bhakti Steps. Bhakti Steps is a devotional practice
        and community support app created to help devotees record daily sadhana,
        view upcoming programs, and stay connected with their spiritual community.
      </p>

      <h2>Contact Support</h2>
      <p>
        For app support, please email:
        <br />
        <strong><a href="mailto:support@kanaisys.com">support@kanaisys.com</a></strong>
      </p>

      <p>
        When contacting support, please include your registered email address,
        device type, a brief description of the issue, and screenshots if available.
      </p>

      <h2>Account Login</h2>
      <p>
        Bhakti Steps uses email-based OTP login. To sign in, open the app,
        enter your registered email address, and enter the OTP code sent to you.
      </p>

      <h2>Account Deletion</h2>
      <p>
        Bhakti Steps provides an in-app option to delete your account.
      </p>

      <p>To delete your account:</p>
      <ol>
        <li>Open the Bhakti Steps app.</li>
        <li>Log in using your registered email address.</li>
        <li>Go to <strong>Profile</strong>.</li>
        <li>Tap <strong>Delete Account</strong>.</li>
        <li>Read the confirmation message carefully.</li>
        <li>Confirm deletion.</li>
      </ol>

      <p>
        Once confirmed, your account and related app data will be deleted,
        and you will be logged out of the app.
      </p>

      <p>
        Please note that account deletion is permanent and cannot be undone.
      </p>

      <h2>Requesting Account Deletion by Email</h2>
      <p>
        If you are unable to access the app, you can request account deletion by emailing:
        <br />
        <strong><a href="mailto:support@kanaisys.com">support@kanaisys.com</a></strong>
      </p>

      <p>
        Please include the email address associated with your Bhakti Steps account.
        We may ask for additional verification before processing the request.
      </p>

      <h2>Privacy and Data</h2>
      <p>
        Bhakti Steps collects only the information required to provide app features
        such as login, sadhana tracking, event information, attendance, and community participation.
      </p>

      <h2>App Information</h2>
      <p>
        <strong>App Name:</strong> Bhakti Steps<br />
        <strong>Developer:</strong> Kanai Smart Systems Pvt Ltd<br />
        <strong>Support Email:</strong> support@kanaisys.com<br />
        <strong>Website:</strong> https://kanaisys.com
      </p>

      <p class="footer">
        Last updated: June 2026
      </p>
    </section>
  </main>
</body>
</html>
`;
  }
}
