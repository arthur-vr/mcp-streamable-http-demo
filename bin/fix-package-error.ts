import { readFileSync, writeFileSync } from 'fs';

function fixPackageJson(): Promise<void> {

    const filePaths = [
        'node_modules/@modelcontextprotocol/sdk/dist/cjs/package.json',
        'node_modules/@modelcontextprotocol/sdk/dist/esm/package.json'
    ];

    const promises = filePaths.map(async (filePath) => {
        try {
            const content = readFileSync(filePath, 'utf8');
            const fixedContent = content.replace(/'/g, '');
            writeFileSync(filePath, fixedContent);
            console.log(`✅ Successfully removed single quotes from ${filePath}! Sparkles✨`);
        } catch (error) {
            console.error(`💔 Error occurred while modifying ${filePath}:`, error);
        }
    });

    return Promise.all(promises).then(() => {
        console.log('💯 All files have been processed! Fabulous! 👑');
    });
}


(async () => {
    await fixPackageJson();
})();