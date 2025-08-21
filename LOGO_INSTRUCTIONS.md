# VectorStream Systems Logo Setup

## Instructions for Adding the Company Logo

To replace the current placeholder logo with the actual VectorStream Systems company logo:

### 1. Add Logo File
Place the official VectorStream Systems logo file in the public directory:
```
/public/vectorstream-logo.png
```

### 2. Logo Requirements
- **Format**: PNG with transparent background (recommended)
- **Size**: 512x512px or similar square format
- **Alternative formats**: SVG, JPG also supported
- **File name**: `vectorstream-logo.png` (or update the src path in VectorStreamLogo.jsx)

### 3. If Using Different File Name or Format
Update the image source in `/src/components/VectorStreamLogo.jsx`:
```jsx
<img 
  src="/your-logo-filename.png" 
  alt="VectorStream Systems Logo"
  className={className}
/>
```

### 4. Current Fallback
If no logo file is found, the component will display "VS" in a blue box as a temporary fallback.

### 5. Multiple Logo Variants (Optional)
You can also add different logo variants:
- `/public/vectorstream-logo-light.png` (for dark backgrounds)
- `/public/vectorstream-logo-dark.png` (for light backgrounds)
- `/public/vectorstream-logo-small.png` (for smaller displays)

Then update the component to use the appropriate variant based on context.
