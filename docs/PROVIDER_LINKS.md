# Provider Link Documentation

This document explains how to create and use provider links for the Well-Being Action Plan application.

## Overview

Provider links allow mental health providers to generate shareable URLs that include provider information and pre-configured plan settings. When patients visit these links, they see a customized welcome page with the provider's information.

## Features Implemented

### Issue #38: URL Parameter Parsing

- Base64 encoding/decoding of provider configuration
- URL-safe parameter encoding
- Schema validation
- Error handling for corrupted or missing parameters
- URL length validation (~2000 character limit)

### Issue #39: Landing Page with Provider Link Detection

- Automatic URL parameter parsing on page load
- Customized welcome message with provider information
- "Get Started" call-to-action button
- Error handling with helpful user guidance
- Loading states during configuration parsing
- Fully responsive design for mobile devices

## Usage

### Creating a Provider Link

```typescript
import { generateProviderUrl, ProviderLinkConfig } from '@/lib/utils';

const config: ProviderLinkConfig = {
  provider: {
    id: 'provider-123',
    name: 'Dr. Sarah Johnson',
    organization: 'Community Mental Health Center',
    contactInfo: {
      phone: '(555) 123-4567',
      email: 'sarah.johnson@cmhc.org',
      website: 'https://cmhc.org',
    },
  },
  customMessage: 'Welcome! I'm excited to support you on your mental health journey.',
  planConfig: {
    enableNotifications: true,
    enableCheckInReminders: true,
    checkInFrequencyHours: 24,
  },
};

const providerUrl = generateProviderUrl('https://wellbeingplan.app', config);
console.log(providerUrl);
// Output: https://wellbeingplan.app?config=eyJwcm92aWRlciI6eyJpZCI6InByb3ZpZGVyLTEyMyIsIm5hbWUiOiJEci4gU2FyYWggSm9obnNvbiIsIm9yZ2FuaXphdGlvbiI6IkNvbW11bml0eSBNZW50YWwgSGVhbHRoIENlbnRlciIsImNvbnRhY3RJbmZvIjp7InBob25lIjoiKDU1NSkgMTIzLTQ1NjciLCJlbWFpbCI6InNhcmFoLmpvaG5zb25AY21oYy5vcmciLCJ3ZWJzaXRlIjoiaHR0cHM6Ly9jbWhjLm9yZyJ9fSwiY3VzdG9tTWVzc2FnZSI6IldlbGNvbWUhIEknbSBleGNpdGVkIHRvIHN1cHBvcnQgeW91IG9uIHlvdXIgbWVudGFsIGhlYWx0aCBqb3VybmV5LiIsInBsYW5Db25maWciOnsiZW5hYmxlTm90aWZpY2F0aW9ucyI6dHJ1ZSwiZW5hYmxlQ2hlY2tJblJlbWluZGVycyI6dHJ1ZSwiY2hlY2tJbkZyZXF1ZW5jeUhvdXJzIjoyNH19
```

### Parsing a Provider Link

The landing page automatically parses provider links. You can also use the utility functions directly:

```typescript
import { parseProviderUrl } from '@/lib/utils';

// Parse from URLSearchParams
const searchParams = new URLSearchParams(window.location.search);
const result = parseProviderUrl(searchParams);

if (result.success && result.config) {
  console.log('Provider:', result.config.provider.name);
  console.log('Custom message:', result.config.customMessage);
} else {
  console.error('Error:', result.error);
}
```

### Encoding/Decoding Manually

```typescript
import { encodeConfig, decodeConfig } from '@/lib/utils';

// Encode a configuration
const encoded = encodeConfig(config);
console.log('Encoded:', encoded);

// Decode back to configuration
const decoded = decodeConfig(encoded);
console.log('Decoded provider:', decoded.provider.name);
```

## URL Structure

Provider links follow this structure:

```
https://[base-url]?config=[base64-encoded-config]
```

The `config` parameter contains:

- Provider information (id, name, organization, contact info)
- Optional custom welcome message
- Optional plan configuration defaults
- Optional redirect URL after onboarding

## Error Handling

The landing page handles several error scenarios:

1. **Missing Config Parameter**: Shows error message with instructions
2. **Invalid Base64**: Catches decoding errors
3. **Invalid JSON**: Catches parsing errors
4. **Missing Required Fields**: Validates provider id and name
5. **URL Too Long**: Warns if encoded config exceeds 1900 characters

## Landing Page States

### Loading State

Displays a spinner while parsing the URL configuration.

### Error State

Shows when:

- No config parameter is found
- The config parameter is invalid or corrupted
- Required provider fields are missing

Provides helpful instructions for patients to resolve the issue.

### Success State

Shows when a valid provider link is detected:

- Provider information card
- Custom welcome message (or default message)
- "What's Next?" onboarding steps
- "Get Started" and "Learn More" buttons
- Privacy notice about local-first data storage

## Testing

### Manual Testing

You can test the implementation using these example URLs:

**Valid Provider Link:**

```
http://localhost:3000?config=eyJwcm92aWRlciI6eyJpZCI6InRlc3QtMTIzIiwibmFtZSI6IkRyLiBTYXJhaCBKb2huc29uIiwib3JnYW5pemF0aW9uIjoiQ29tbXVuaXR5IE1lbnRhbCBIZWFsdGggQ2VudGVyIn0sImN1c3RvbU1lc3NhZ2UiOiJXZWxjb21lISBJJ20gZXhjaXRlZCB0byBzdXBwb3J0IHlvdSBvbiB5b3VyIG1lbnRhbCBoZWFsdGggam91cm5leS4ifQ
```

**Error - No Config:**

```
http://localhost:3000
```

**Error - Invalid Config:**

```
http://localhost:3000?config=invalid-data
```

### Automated Testing

Run the existing test suite:

```bash
pnpm test
```

## Security Considerations

- Provider links are read-only (patients can't modify provider information)
- Configuration is validated before use
- No sensitive information should be included in provider links
- Links are designed to be shareable publicly
- Patient data is never transmitted via URL parameters

## Browser Compatibility

The implementation uses standard browser APIs:

- `btoa`/`atob` for Base64 encoding/decoding
- `URLSearchParams` for URL parsing
- `localStorage` for configuration persistence

Supported in all modern browsers (Chrome, Firefox, Safari, Edge).

## Next Steps

Future enhancements:

- Connect "Get Started" button to onboarding flow
- Add provider logo display support
- Implement URL compression for longer configurations
- Add analytics to track provider link usage
- Support multiple provider templates/themes
