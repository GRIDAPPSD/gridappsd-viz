const { RawSource } = require('webpack-sources');

module.exports = {
  RefReplacerPlugin: class {

    constructor() {
      this.previousLightThemeFilename = ''
      this.previousDarkThemeFilename = '';
    }

    /**
     * @param {import('webpack').Compiler} compiler
     */
    apply(compiler) {
      const lightThemeStyleFilenameRef = '__LIGHT_THEME_STYLE_FILENAME__';
      const darkThemeStyleFilenameRef = '__DARK_THEME_STYLE_FILENAME__';

      compiler.hooks.afterCompile.tap('RefReplacerPlugin', compilation /** @type {import('webpack').Compilation} */ => {
        const assetNames = compilation.getAssets().map(e => e.name);
        const mainChunkName = assetNames.find(e => e.startsWith('main') && e.endsWith('.js'));
        const newLightThemeFilename = assetNames.find(e => e.startsWith('light') && e.endsWith('.css'));
        const newDarkThemeFilename = assetNames.find(e => e.startsWith('dark') && e.endsWith('.css'));

        const mainAsset = compilation.getAsset(mainChunkName);
        if (mainAsset) {
          const sourceCode = mainAsset.source.source();
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
          compilation.updateAsset(
            mainAsset.name,
            new RawSource(modifiedSourceCode),
            mainAsset.info
          );
        }

        this.previousLightThemeFilename = newLightThemeFilename;
        this.previousDarkThemeFilename = newDarkThemeFilename;
      });
    }
  },

  NoOpPlugin: class {
    apply() {

    }
  },

  DeleteAssetsPlugin: class {

    /**
     *
     * @param {Array<RegExp>} patterns
     */
    constructor(patterns = []) {
      if (!patterns) {
        throw new Error('ExcludeAssetsPlugin requires one boolean-returning functionargument')
      }
      this._patterns = patterns;
    }

    apply(compiler) {
      compiler.hooks.afterCompile.tap('ExcludeAssetsPlugin', compilation => {
        const assetNames = compilation.getAssets().map(e => e.name);
        assetNames.filter(e => this._patterns.some(pattern => pattern.test(e))).forEach(e => compilation.deleteAsset(e));
      });
    }
  }

};
