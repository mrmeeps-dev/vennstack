import { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function versionPlugin(buildHash: string): Plugin {
  return {
    name: 'version-plugin',
    writeBundle(options) {
      // Write version.json to dist folder
      const versionData = {
        version: buildHash,
        buildTime: new Date().toISOString(),
      };
      const outputDir = options.dir || 'dist';
      writeFileSync(
        join(outputDir, 'version.json'),
        JSON.stringify(versionData, null, 2)
      );
    },
  };
}

