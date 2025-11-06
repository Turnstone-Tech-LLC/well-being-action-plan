# URL Sharing Feature

## Overview

The URL sharing feature enables users to share their well-being plan configurations through URL links. This allows plans to be easily distributed, imported, or used as templates by others.

## Features

- **Encoding**: Convert plan configurations into URL-safe compressed strings
- **Decoding**: Extract and validate plan configurations from URLs
- **Validation**: Automatic schema validation using Zod
- **Compression**: Uses gzip compression to keep URLs under 2000 characters when possible
- **Error Handling**: Comprehensive error handling with detailed error messages

## Implementation

### Core Module: `urlConfig.ts`

Located at `src/lib/utils/urlConfig.ts`, this module provides all URL configuration functionality.

#### Key Functions

##### `encodeConfig(config: ShareablePlanConfig): string`

Encodes a plan configuration into a URL-safe base64 string.

```typescript
import { encodeConfig } from '@/lib/utils/urlConfig';

const encoded = encodeConfig({
  title: "My Plan",
  description: "A helpful plan",
  zoneStrategies: [
    {
      zone: ZoneType.Green,
      copingStrategyIds: ['strategy-1'],
      triggers: []
    }
  ],
  config: {
    enableNotifications: true,
    enableCheckInReminders: false,
    enableDataSync: false
  }
});
// Returns: "eJyLjgUAARUAuQ..."
```

##### `decodeConfig(encoded: string): DecodeResult<ShareablePlanConfig>`

Decodes and validates a URL-safe string back into a plan configuration.

```typescript
import { decodeConfig } from '@/lib/utils/urlConfig';

const result = decodeConfig("eJyLjgUAARUAuQ...");
if (result.success) {
  console.log("Loaded plan:", result.data.title);
} else {
  console.error("Error:", result.error);
}
```

##### `generateShareableUrl(config: ShareablePlanConfig, baseUrl?: string): string`

Generates a complete URL with the encoded plan as a query parameter.

```typescript
import { generateShareableUrl } from '@/lib/utils/urlConfig';

const url = generateShareableUrl(config, "https://myapp.com");
// Returns: "https://myapp.com?plan=eJyLjgUAARUAuQ..."
```

##### `extractConfigFromUrl(url: string | URL): DecodeResult<ShareablePlanConfig>`

Extracts and decodes a plan configuration from a URL.

```typescript
import { extractConfigFromUrl } from '@/lib/utils/urlConfig';

const result = extractConfigFromUrl("https://myapp.com?plan=eJyLjgUAARUAuQ...");
if (result.success) {
  // Use result.data
}
```

##### `canShareViaUrl(config: ShareablePlanConfig, baseUrl?: string)`

Validates if a plan can be safely shared via URL.

```typescript
import { canShareViaUrl } from '@/lib/utils/urlConfig';

const check = canShareViaUrl(config);
if (check.canShare) {
  console.log(`URL will be ${check.estimatedLength} characters`);
} else {
  console.error(check.reason);
}
```

### React Integration: `PlanUrlLoader` Component

Located at `src/components/plan-url-loader.tsx`, this component automatically detects and loads plans from URL parameters.

#### Usage

```typescript
import { PlanUrlLoader } from '@/components/plan-url-loader';

function MyApp() {
  const handlePlanLoaded = (config) => {
    console.log("Plan loaded from URL:", config);
    // Apply configuration to your app state
  };

  const handleError = (error) => {
    console.error("Failed to load plan:", error);
  };

  return (
    <>
      <PlanUrlLoader
        onPlanLoaded={handlePlanLoaded}
        onError={handleError}
        clearUrlAfterLoad={true}
        debug={false}
      />
      <YourMainContent />
    </>
  );
}
```

#### Hook: `usePlanFromUrl`

For more control, use the hook directly:

```typescript
import { usePlanFromUrl } from '@/components/plan-url-loader';

function MyComponent() {
  const { loadedPlan, error, isLoading, reload } = usePlanFromUrl();

  if (isLoading) return <div>Loading plan...</div>;
  if (error) return <div>Error: {error}</div>;
  if (loadedPlan) return <div>Loaded: {loadedPlan.title}</div>;
  return <div>No plan in URL</div>;
}
```

## URL Structure

Plans are shared using the following URL structure:

```
https://example.com/?plan={encoded_config}
```

Where `{encoded_config}` is a URL-safe base64-encoded, compressed JSON string containing the shareable plan configuration.

### Encoding Process

1. Extract shareable fields from WellBeingPlan
2. Validate against Zod schema
3. Convert to JSON string
4. Compress using pako (gzip)
5. Encode to URL-safe base64
6. Add as query parameter

### Decoding Process

1. Extract `plan` query parameter from URL
2. Decode from URL-safe base64
3. Decompress using pako
4. Parse JSON
5. Validate against Zod schema
6. Return validated configuration or error

## Shareable Configuration

The `ShareablePlanConfig` type includes only non-sensitive, non-user-specific data:

### Included Fields
- `title`: Plan title
- `description`: Plan description (optional)
- `zoneStrategies`: Array of zone-specific strategies and triggers
- `config`: Configuration settings (excluding sensitive data)

### Excluded Fields
- `id`: User-specific identifier
- `userId`: User identifier
- `createdAt`, `updatedAt`, `lastReviewedAt`: Timestamps
- `isActive`: Activation status
- `goalIds`: User-specific goals
- `shareWithSupporters`: Privacy setting
- `sharedUserIds`: Sensitive user data

## Size Limitations

- **Target**: Under 2000 characters for broad browser compatibility
- **Compression**: Helps keep URLs manageable
- **Validation**: The `canShareViaUrl` function checks if a plan exceeds the limit
- **Recommendation**: Simplify large plans before sharing

### Handling Large Plans

If a plan is too large to share via URL:

```typescript
const check = canShareViaUrl(config);
if (!check.canShare && check.estimatedLength > MAX_URL_LENGTH) {
  // Plan is too large - consider:
  // 1. Reducing the number of strategies
  // 2. Shortening descriptions
  // 3. Using an alternative sharing method
}
```

## Error Handling

All decode operations return a `DecodeResult` type:

```typescript
type DecodeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Common Errors

- **"No plan configuration found in URL"**: The URL doesn't contain a `plan` parameter
- **"Invalid input"**: The encoded string is malformed
- **"Invalid plan structure"**: The decoded data doesn't match the expected schema
- **"Failed to decode configuration"**: Decompression or parsing failed

### Error Handling Example

```typescript
const result = extractConfigFromUrl(url);

if (!result.success) {
  switch (true) {
    case result.error.includes('No plan configuration found'):
      // No plan in URL - this is normal
      break;
    case result.error.includes('Invalid plan structure'):
      // Schema validation failed
      console.error('Invalid plan format:', result.error);
      break;
    default:
      // Other errors
      console.error('Failed to load plan:', result.error);
  }
}
```

## Security Considerations

1. **No Sensitive Data**: User IDs and sharing permissions are explicitly excluded
2. **Validation**: All decoded data is validated against strict schemas
3. **No Execution**: Plan data is purely declarative - no code execution
4. **URL Sanitization**: Base64 encoding prevents URL injection

## Testing

Comprehensive tests are available in `src/lib/utils/__tests__/urlConfig.test.ts`.

Run tests:

```bash
pnpm test:run urlConfig
```

### Test Coverage

- Basic encoding/decoding
- Data integrity through encode/decode cycles
- Unicode and special character handling
- Schema validation and error handling
- URL generation and extraction
- Size estimation and validation
- Edge cases and boundary conditions

## Migration Guide

### From Previous Sharing Methods

If you previously used other methods to share plans:

1. Use `encodeConfig()` to convert your plan data
2. Generate a shareable URL with `generateShareableUrl()`
3. Share the URL with users

### Updating Existing Code

```typescript
// Old approach (if you had one)
const planData = JSON.stringify(plan);
const url = `https://myapp.com?data=${btoa(planData)}`;

// New approach
import { generateShareableUrl } from '@/lib/utils/urlConfig';
const url = generateShareableUrl(shareablePlanConfig);
```

## Best Practices

1. **Always validate**: Use the result type and check `success` before accessing data
2. **Handle errors gracefully**: Provide user-friendly error messages
3. **Check size limits**: Use `canShareViaUrl()` before generating URLs
4. **Clear URL params**: Set `clearUrlAfterLoad={true}` to prevent re-loading on refresh
5. **Privacy first**: Never include user IDs or sensitive data in shareable configs

## Examples

### Basic Sharing Flow

```typescript
import {
  generateShareableUrl,
  extractConfigFromUrl,
  canShareViaUrl
} from '@/lib/utils/urlConfig';

// 1. Check if plan can be shared
const check = canShareViaUrl(myPlan);
if (!check.canShare) {
  alert(`Plan is too large (${check.estimatedLength} chars): ${check.reason}`);
  return;
}

// 2. Generate shareable URL
const shareUrl = generateShareableUrl(myPlan);

// 3. Share URL (copy to clipboard, send via email, etc.)
await navigator.clipboard.writeText(shareUrl);
alert('Plan URL copied to clipboard!');

// 4. On recipient's side - load from URL
const result = extractConfigFromUrl(window.location.href);
if (result.success) {
  applyPlanConfig(result.data);
} else {
  showError(result.error);
}
```

### Automatic Loading on Page Load

```typescript
import { PlanUrlLoader } from '@/components/plan-url-loader';

function App() {
  return (
    <>
      <PlanUrlLoader
        onPlanLoaded={(config) => {
          // Show notification
          toast.success(`Loaded plan: ${config.title}`);

          // Apply to app state
          setPlan(config);
        }}
        onError={(error) => {
          toast.error(`Failed to load plan: ${error}`);
        }}
        clearUrlAfterLoad={true}
      />
      <MainApp />
    </>
  );
}
```

## Troubleshooting

### "URL too long" warnings

**Solution**: Simplify the plan by:
- Reducing the number of strategies
- Shortening trigger descriptions
- Removing optional fields
- Using fewer reminder times

### "Invalid plan structure" errors

**Solution**: Ensure your config matches the `ShareablePlanConfig` type:
- Required: `title`, `zoneStrategies`, `config`
- Required config fields: `enableNotifications`, `enableCheckInReminders`, `enableDataSync`

### Plans not loading from URL

**Checklist**:
1. Check browser console for errors
2. Verify the `plan` query parameter exists
3. Test with `extractConfigFromUrl()` directly
4. Enable debug mode: `<PlanUrlLoader debug={true} />`

## API Reference

See the complete API documentation in the source files:
- `src/lib/utils/urlConfig.ts` - Core functionality
- `src/components/plan-url-loader.tsx` - React integration

## Contributing

When contributing to this feature:

1. Maintain backward compatibility with existing encoded URLs
2. Add tests for new functionality
3. Update this documentation
4. Consider URL size impact of changes
5. Validate schemas thoroughly
