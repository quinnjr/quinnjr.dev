import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Esbuild plugin that automatically adds SRI (Subresource Integrity) attributes
 * to script tags in the generated HTML files
 */
export default function sriPlugin() {
  return {
    name: 'sri-plugin',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors && result.errors.length > 0) {
          return;
        }

        try {
          // Get output directory from build options
          const outdir = build.initialOptions.outdir;
          if (!outdir) {
            return;
          }

          // Find the index.html file in the output directory
          const indexPath = join(outdir, 'index.html');
          
          if (!existsSync(indexPath)) {
            return;
          }

          const htmlContent = readFileSync(indexPath, 'utf-8');
          let updatedHtml = htmlContent;
          let modified = false;

          // Find all script tags with src attributes (local files only)
          const scriptRegex = /<script([^>]*src=["']([^"']+)["'][^>]*)>/gi;
          const scripts = [];
          let match;

          while ((match = scriptRegex.exec(htmlContent)) !== null) {
            const fullTag = match[0];
            const attributes = match[1];
            const src = match[2];

            // Skip if already has integrity attribute
            if (attributes.includes('integrity=')) {
              continue;
            }

            // Only process local files (not CDN/external URLs)
            if (
              !src.startsWith('http://') &&
              !src.startsWith('https://') &&
              !src.startsWith('//') &&
              !src.startsWith('data:')
            ) {
              scripts.push({ fullTag, attributes, src });
            }
          }

          // Generate SRI hashes for each script file
          for (const script of scripts) {
            // Resolve script path relative to output directory
            const scriptPath = join(outdir, script.src.replace(/^\//, ''));

            if (!existsSync(scriptPath)) {
              continue;
            }

            try {
              const scriptContent = readFileSync(scriptPath);
              const hash = createHash('sha384').update(scriptContent).digest('base64');
              const integrity = `sha384-${hash}`;

              // Update the script tag with integrity and crossorigin
              let newAttributes = script.attributes;
              
              // Add integrity attribute
              newAttributes = `${newAttributes} integrity="${integrity}"`;
              
              // Add crossorigin if not present
              if (!newAttributes.includes('crossorigin=')) {
                newAttributes = `${newAttributes} crossorigin="anonymous"`;
              }

              const newTag = `<script${newAttributes}>`;
              updatedHtml = updatedHtml.replace(script.fullTag, newTag);
              modified = true;
            } catch (err) {
              // Script file not found or error reading, skip
              console.warn(`Warning: Could not generate SRI for ${script.src}: ${err.message}`);
            }
          }

          // Write updated HTML if modified
          if (modified) {
            writeFileSync(indexPath, updatedHtml, 'utf-8');
            console.log(`✓ Added SRI integrity attributes to ${scripts.length} script tag(s)`);
          }
        } catch (err) {
          console.warn(`Warning: SRI plugin error: ${err.message}`);
        }
      });
    },
  };
}

