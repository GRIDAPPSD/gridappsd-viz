module.exports = {
  RefReplacerPlugin: class {

    constructor() {
      this.previousLightThemeFilename = ''
      this.previousDarkThemeFilename = '';
    }

    apply(compiler) {
      const lightThemeStyleFilenameRef = '__LIGHT_THEME_STYLE_FILENAME__';
      const darkThemeStyleFilenameRef = '__DARK_THEME_STYLE_FILENAME__';
      const { webpack } = compiler;
      const { Compilation } = webpack;
      const { RawSource } = webpack.sources;

      compiler.hooks.compilation.tap('RefReplacerPlugin', compilation => {
        compilation.hooks.processAssets.tap(
          {
            name: 'RefReplacerPlugin',
            stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
          },
          () => {
            const assetNames = compilation.getAssets().map(e => e.name);
            if (assetNames.length > 0) {
              const mainChunkName = assetNames.find(e => e.startsWith('main') && e.endsWith('.js'));
              const newLightThemeFilename = assetNames.find(e => e.startsWith('light') && e.endsWith('.css'));
              const newDarkThemeFilename = assetNames.find(e => e.startsWith('dark') && e.endsWith('.css'));
              const sourceCode = compilation.getAsset(mainChunkName).source.source();
              let modifiedSourceCode = sourceCode;

              if (sourceCode.includes(lightThemeStyleFilenameRef)) {
                modifiedSourceCode = sourceCode
                  .replace(lightThemeStyleFilenameRef, `"${newLightThemeFilename}"`)
                  .replace(darkThemeStyleFilenameRef, `"${newDarkThemeFilename}"`);
              } else {
                modifiedSourceCode = sourceCode
                  .replace(this.previousLightThemeFilename, newLightThemeFilename)
                  .replace(this.previousDarkThemeFilename, newDarkThemeFilename);
              }

              compilation.updateAsset(mainChunkName, new RawSource(modifiedSourceCode));

              this.previousLightThemeFilename = newLightThemeFilename;
              this.previousDarkThemeFilename = newDarkThemeFilename;
            }
          }
        );
      });
    }
  },

  NoOpPlugin: class {
    apply() {

    }
  }
};
