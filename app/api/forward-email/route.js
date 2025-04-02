import 'dotenv/config';
import nodemailer from "nodemailer";

// Utility function to get Indian time in a formatted string
function getIndianDateTime() {
    const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return new Date().toLocaleString('en-IN', options);
}

// Function to create the email HTML content with responsive design
function createEmailTemplate(text, additionalFields, timestamp) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Notification</title>
        <style>
            /* Base styles for email clients */
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
            }
            .header {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 5px 5px 0 0;
                border-bottom: 3px solid #007bff;
            }
            .content {
                padding: 20px;
                background-color: #ffffff;
            }
            .footer {
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 0 0 5px 5px;
                font-size: 12px;
                color: #666666;
            }
            .timestamp {
                color: #666666;
                font-size: 14px;
                margin-top: 10px;
            }
            .field {
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 4px;
            }
            .field-label {
                font-weight: bold;
                color: #007bff;
            }
            
            /* Dark mode support for some email clients */
            @media (prefers-color-scheme: dark) {
                .email-container {
                    background-color: #333333 !important;
                    color: #ffffff !important;
                }
                .header, .footer {
                    background-color: #222222 !important;
                }
                .field {
                    background-color: #444444 !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h2 style="margin: 0; color: #007bff;">${'Notification'}</h2>
                <div class="timestamp">
                    ${timestamp}
                </div>
            </div>
            <div class="content">
                ${text ? `<div class="field">${text}</div>` : ''}
                
                ${additionalFields ? `
                <h3 style="color: #333333;">Additional Information</h3>
                ${additionalFields.split('\n').map(field =>
        field.trim() ? `
                    <div class="field">
                        <span class="field-label">${field.split(':')[0]}:</span>
                        <span>${field.split(':')[1] || ''}</span>
                    </div>` : ''
    ).join('')}` : ''}
            </div>
            <div class="footer">
                <p>This is an automated notification from XNow IT.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}


// Function to create error response page
function createErrorPage(error, timestamp) {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Processing Error</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background-color: #f0f2f5;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .error-container {
                background-color: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                width: 90%;
                text-align: center;
            }
            .error-icon {
                width: 70px;
                height: 70px;
                background-color: #ff4444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
            }
            .error-icon::after {
                content: "!";
                color: white;
                font-size: 40px;
                font-weight: bold;
            }
            .error-title {
                color: #ff4444;
                font-size: 24px;
                margin-bottom: 1rem;
            }
            .error-message {
                color: #666;
                margin-bottom: 1.5rem;
                line-height: 1.6;
            }
            .timestamp {
                color: #888;
                font-size: 14px;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid #eee;
            }
            .retry-button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 1rem;
                transition: background-color 0.3s;
            }
            .retry-button:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-icon"></div>
            <h1 class="error-title">Processing Error</h1>
            <p class="error-message">
                We encountered an error while processing your request. Please try again.
            </p>
            <a href="/" class="retry-button">Try Again</a>
            <div class="timestamp">
                Error occurred at: ${timestamp}
            </div>
        </div>
    </body>
    </html>`;
}

export async function POST(req) {
    try {
        // Parse request body based on content type
        let body;
        const contentType = req.headers.get("content-type");
        if (contentType === "application/json") {
            body = await req.json();
        } else {
            body = Object.fromEntries(new URLSearchParams(await req.text()));
        }

        // Destructure and format fields
        const { text, ...rest } = body;


        const additionalFields = Object.entries(rest)
            .map(([field, value]) => `${field}: ${value}`)
            .join('\n');

        // Get current Indian time
        const timestamp = getIndianDateTime();

        // Create HTML email content
        const htmlContent = createEmailTemplate(text, additionalFields, timestamp);

        // Configure email transport with bounce prevention
        const transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            tls: {
                ciphers: "SSLv3",
                rejectUnauthorized: false
            },
            requireTLS: true,
            pool: true, // Use pooled connections
            maxConnections: 5, // Limit concurrent connections
            maxMessages: Infinity, // No limit on messages per connection
            auth: {
                user: "connect@coderealm.co",
                pass: "Console.log(3);"
            },
            // Disable bounce handling
            sendmail: true,
            ignoreTLS: false,
            skipEncoding: true
        });

        // Set up email options with bounce prevention
        const mailOptions = {
            from: "coderealm <connect.coderealm.co>",
            to: "varunbhole02@gmail.com",
            html: htmlContent,
            headers: {
                'Precedence': 'bulk', // Indicates bulk mail
                'X-Auto-Response-Suppress': 'All', // Suppress auto-responses
                'Auto-Submitted': 'auto-generated' // Indicates automated email
            },
            dsn: {
                id: false,
                return: false,
                notify: false
            }
        };

        // Send email without waiting for delivery status
        await transporter.sendMail(mailOptions);

        return new Response(null, {
            status: 204,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store'
            }
        });

    } catch (error) {
        console.error('Processing error:', error);

        // Return error page
        const timestamp = getIndianDateTime();
        return new Response(createErrorPage(error.message, timestamp), {
            status: 500,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store'
            }
        });
    }
}
