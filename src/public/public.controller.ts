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

  @Get('privacy-policy')
  @Header('Content-Type', 'text/html')
  privacyPolicyPage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bhakti Steps Privacy Policy</title>
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
      max-width: 900px;
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
      <h1>Bhakti Steps Privacy Policy</h1>

      <p><strong>Effective Date:</strong> June 2026</p>

      <p>
        Bhakti Steps is operated by Kanai Smart Systems Pvt Ltd. This Privacy Policy explains how we collect, use, store, and protect information when you use the Bhakti Steps mobile application.
      </p>

      <h2>1. Information We Collect</h2>
      <p>Bhakti Steps may collect the following information:</p>
      <ul>
        <li>Name</li>
        <li>Email address</li>
        <li>Login and authentication information, including OTP verification</li>
        <li>Sadhana entries submitted by the user</li>
        <li>Program attendance information</li>
        <li>Group or facilitator relationship information</li>
        <li>Device token for push notifications</li>
        <li>Basic app usage information required to provide app features</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Allow users to sign in securely using email-based OTP login</li>
        <li>Help users record and view daily sadhana</li>
        <li>Help facilitators manage program attendance and member progress</li>
        <li>Show relevant events, programs, and app content</li>
        <li>Send app notifications where applicable</li>
        <li>Maintain app security and improve app functionality</li>
      </ul>

      <h2>3. Sharing of Information</h2>
      <p>
        We do not sell user personal information. Information may be visible to authorized facilitators or administrators only where required for app features such as group management, attendance, and sadhana progress tracking.
      </p>

      <h2>4. Data Storage and Security</h2>
      <p>
        User data is stored securely using our backend systems and database provider. We take reasonable steps to protect user data from unauthorized access, misuse, or disclosure.
      </p>

      <h2>5. Account Deletion</h2>
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
        Once confirmed, your account and related app data will be deleted, and you will be logged out of the app.
      </p>

      <p>
        If you are unable to access the app, you may request account deletion by emailing:
        <br />
        <strong><a href="mailto:support@kanaisys.com">support@kanaisys.com</a></strong>
      </p>

      <h2>6. Children’s Privacy</h2>
      <p>
        If a parent or guardian believes that a child has provided personal information without appropriate consent, they may contact us to request deletion.
      </p>

      <h2>7. Push Notifications</h2>
      <p>
        Bhakti Steps may use push notifications to send information about events, reminders, programs, or app updates. Users can manage notification permissions through their device settings.
      </p>

      <h2>8. Third-Party Services</h2>
      <p>
        Bhakti Steps may use trusted third-party services for hosting, database storage, authentication, notifications, or app distribution. These services are used only to support the operation of the app.
      </p>

      <h2>9. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Any updates will be posted on this page with a revised effective date.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        <strong>Kanai Smart Systems Pvt Ltd</strong><br />
        Email: <strong><a href="mailto:support@kanaisys.com">support@kanaisys.com</a></strong><br />
        App: Bhakti Steps
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
