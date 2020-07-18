module.exports = {
  RefReplacerPlugin: class {

    constructor() {
      this.previousLightThemeFilename = ''
      this.previousDarkThemeFilename = '';
    }

    apply(compiler) {
      const lightThemeStyleFilenameRef = '__LIGHT_THEME_STYLE_FILENAME__';
      const darkThemeStyleFilenameRef = '__DARK_THEME_STYLE_FILENAME__';
      const defaultSelectedThemeRef = '__DEFAULT_SELECTED_THEME__';

      compiler.hooks.emit.tap('RefReplacerPlugin', compilation => {
        const assetNames = compilation.getAssets().map(e => e.name);
        const mainChunkName = assetNames.find(e => e.startsWith('main') && e.endsWith('.js'));
        const hash = mainChunkName.split('.')[1];
        const newLightThemeFilename = `light.${hash}.css`;
        const newDarkThemeFilename = `dark.${hash}.css`;
        const sourceCode = compilation.assets[mainChunkName].source();
        let modifiedSourceCode = sourceCode;

        if (sourceCode.includes(lightThemeStyleFilenameRef)) {
          modifiedSourceCode = sourceCode
            .replace(lightThemeStyleFilenameRef, `"${newLightThemeFilename}"`)
            .replace(darkThemeStyleFilenameRef, `"${newDarkThemeFilename}"`)
            .replace(defaultSelectedThemeRef, '"dark"');
        } else {
          modifiedSourceCode = sourceCode
            .replace(this.previousLightThemeFilename, newLightThemeFilename)
            .replace(this.previousDarkThemeFilename, newDarkThemeFilename);
        }

        delete compilation.assets[`dark.${hash}.js`];
        delete compilation.assets[`dark.${hash}.js.map`];
        delete compilation.assets[`light.${hash}.js`];
        delete compilation.assets[`light.${hash}.js.map`];
        delete compilation.assets[`main.${hash}.css`];
        delete compilation.assets[`main.${hash}.css.map`];

        compilation.getAsset(mainChunkName).source.children = [
          {
            source() {
              return modifiedSourceCode;
            },
            size() {
              return modifiedSourceCode.length;
            }
          }
        ];

        this.previousLightThemeFilename = newLightThemeFilename;
        this.previousDarkThemeFilename = newDarkThemeFilename;
      });
    }
  },

  NoOpPlugin: class {
    apply() {

    }
  }
};
