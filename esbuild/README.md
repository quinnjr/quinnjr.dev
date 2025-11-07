# Esbuild Configuration

This directory contains custom esbuild plugins and configuration for the Angular build process.

## SRI Plugin (`sri-plugin.mjs`)

The SRI (Subresource Integrity) plugin automatically adds `integrity` and `crossorigin` attributes to all local script tags in the generated HTML files.

### How it works

1. After the build completes, the plugin scans the output `index.html` file
2. It finds all `<script>` tags with `src` attributes pointing to local files
3. For each script file, it calculates a SHA-384 hash
4. It adds `integrity="sha384-{hash}"` and `crossorigin="anonymous"` attributes to the script tags
5. External scripts (CDN URLs) are skipped

### Configuration

The plugin is configured in `angular.json`:

```json
{
  "plugins": ["./esbuild/sri-plugin.mjs"]
}
```

### Benefits

- **Security**: Ensures scripts haven't been tampered with
- **Automatic**: No manual hash calculation needed
- **Production-ready**: Only processes local bundled scripts

### Example Output

Before:
```html
<script src="main.js"></script>
```

After:
```html
<script src="main.js" integrity="sha384-..." crossorigin="anonymous"></script>
```

