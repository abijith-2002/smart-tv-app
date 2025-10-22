#!/usr/bin/env node
/**
 * PUBLIC_INTERFACE
 * Zip the Samsung-My-TV directory into Samsung-My-TV.zip at the repository root.
 * - Validates the source directory exists
 * - Overwrites the target zip if present
 * - Preserves directory structure
 * - Logs progress and exits with appropriate status code
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Create a zip archive of a directory.
 * PUBLIC_INTERFACE
 * @param {string} sourceDir - Relative or absolute path to the directory to zip.
 * @param {string} outZipPath - Output zip file path (will be overwritten if exists).
 * @returns {Promise<void>} Resolves when completed.
 */
async function zipDirectory(sourceDir, outZipPath) {
  return new Promise((resolve, reject) => {
    // Validate source directory
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      return reject(new Error(`Source directory not found: ${sourceDir}`));
    }

    // Ensure output directory exists
    const outDir = path.dirname(outZipPath);
    fs.mkdirSync(outDir, { recursive: true });

    // Remove existing file if present (overwrite behavior)
    if (fs.existsSync(outZipPath)) {
      try {
        fs.unlinkSync(outZipPath);
      } catch (e) {
        return reject(new Error(`Unable to overwrite existing zip: ${outZipPath}. ${e.message}`));
      }
    }

    const output = fs.createWriteStream(outZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zip created: ${outZipPath}`);
      console.log(`Total bytes: ${archive.pointer()}`);
      resolve();
    });

    output.on('error', (err) => {
      reject(err);
    });

    archive.on('warning', (err) => {
      // Non-blocking warnings (e.g., missing files). Log and continue.
      console.warn('Archive warning:', err.message);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    // Add directory contents, preserving structure. Second arg is the top-level folder name inside zip.
    const baseName = path.basename(path.resolve(sourceDir));
    archive.directory(sourceDir, baseName);
    archive.finalize();
  });
}

// Entrypoint
(async function main() {
  try {
    const repoRoot = path.resolve(__dirname, '..');
    const source = path.resolve(repoRoot, 'Samsung-My-TV');
    const outZip = path.resolve(repoRoot, 'Samsung-My-TV.zip');

    console.log('Preparing to zip:');
    console.log(` - Source: ${source}`);
    console.log(` - Output: ${outZip}`);

    await zipDirectory(source, outZip);

    console.log('Success: Samsung-My-TV.zip is ready at the repository root.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create zip:', err.message || err);
    process.exit(1);
  }
})();
