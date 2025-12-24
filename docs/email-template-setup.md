# Magic Link Email Template Setup

This document describes how to customize the magic link email in Supabase for the Well-Being Action Plan application.

## Local Development

The email template is already configured in `supabase/config.toml` and will be used automatically when running Supabase locally. You can preview emails at http://localhost:54324 (Inbucket) when developing locally.

## Production Setup

To update the magic link email template in the production Supabase project:

1. Go to the Supabase Dashboard: https://supabase.com/dashboard
2. Select the **WBAP Production** project
3. Navigate to **Authentication** > **Email Templates**
4. Click on **Magic Link**

### Subject Line

```
Sign in to Well-Being Action Plan
```

### Email Body (HTML)

Copy and paste the following HTML into the email template editor:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Sign in to Well-Being Action Plan</title>
	</head>
	<body
		style="margin: 0; padding: 0; font-family: Calibri, 'Gill Sans', 'Trebuchet MS', sans-serif; background-color: #f9fafb;"
	>
		<table
			role="presentation"
			width="100%"
			cellspacing="0"
			cellpadding="0"
			style="background-color: #f9fafb;"
		>
			<tr>
				<td align="center" style="padding: 40px 20px;">
					<table
						role="presentation"
						width="100%"
						cellspacing="0"
						cellpadding="0"
						style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"
					>
						<!-- Header with UVM Catamount Green -->
						<tr>
							<td
								style="background-color: #00594C; padding: 32px 40px; border-radius: 8px 8px 0 0; text-align: center;"
							>
								<h1
									style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.05em;"
								>
									Well-Being Action Plan
								</h1>
								<p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">
									UVM Medical Center - Golisano Children's Hospital
								</p>
							</td>
						</tr>

						<!-- Main Content -->
						<tr>
							<td style="padding: 40px;">
								<h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
									Sign in to your provider account
								</h2>
								<p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
									Click the button below to securely sign in to the Well-Being Action Plan provider
									portal. This link will expire in 1 hour.
								</p>

								<!-- Sign In Button with UVM Catamount Green -->
								<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
									<tr>
										<td style="border-radius: 6px; background-color: #00594C;">
											<a
												href="{{ .ConfirmationURL }}"
												target="_blank"
												style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;"
											>
												Sign In to Provider Portal
											</a>
										</td>
									</tr>
								</table>

								<p style="margin: 32px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
									If the button doesn't work, copy and paste this link into your browser:
								</p>
								<p style="margin: 8px 0 0 0; word-break: break-all;">
									<a href="{{ .ConfirmationURL }}" style="color: #00594C; font-size: 14px;"
										>{{ .ConfirmationURL }}</a
									>
								</p>

								<hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

								<p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
									If you didn't request this email, you can safely ignore it. Only someone with
									access to your email can sign in using this link.
								</p>
							</td>
						</tr>

						<!-- Footer -->
						<tr>
							<td
								style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb;"
							>
								<p style="margin: 0; color: #6b7280; font-size: 12px;">
									&copy; UVM Medical Center - Golisano Children's Hospital
								</p>
								<p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
									This is an automated message from the Well-Being Action Plan system.
								</p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>
```

5. Click **Save** to apply the changes

## Testing

After updating the template:

1. Navigate to the provider login page
2. Enter a valid email address
3. Check the email inbox (or Inbucket for local development)
4. Verify the email displays correctly with:
   - UVM Catamount Green header (#00594C)
   - Clear "Sign In to Provider Portal" button
   - Proper branding and footer

## Brand Colors Used

- **UVM Catamount Green:** `#00594C` (header and buttons)
- **Text Dark:** `#1f2937`
- **Text Muted:** `#4b5563`
- **Background:** `#f9fafb`
