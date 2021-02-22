import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { SlideToggle, FormControlModel } from '@shared/form';
import { Fade } from '@shared/effects/fade';
import { Dialog, ConfirmationDialog } from '@shared/overlay/dialog';

import './Settings.light.scss';
import './Settings.dark.scss';

interface Props {
}

interface State {
  showSettingsMenu: boolean;
}

export class Settings extends React.Component<Props, State> {

  readonly isDarkThemeSelectedFormControl = new FormControlModel((localStorage.getItem('theme') as 'light' | 'dark' || 'dark') === 'dark');
  readonly enableLoggingFormControl = new FormControlModel((localStorage.getItem('isLoggingEnabled') ?? String(__DEVELOPMENT__)) === 'true');
  readonly menuOpenerRef = React.createRef<HTMLDivElement>();

  private _isLoggingEnabled = this.enableLoggingFormControl.getValue();

  constructor(props: Props) {
    super(props);

    this.state = {
      showSettingsMenu: false
    };

    this.showSettingsMenu = this.showSettingsMenu.bind(this);
  }

  componentDidMount() {
    this._watchForThemeChanges();
    this._watchForLoggingEnablement();
  }

  private _watchForThemeChanges() {
    if (this.isDarkThemeSelectedFormControl.getValue() === false) {
      setTimeout(() => {
        this._toggleTheme(false);
      }, 16);
    }
    this.isDarkThemeSelectedFormControl.valueChanges()
      .subscribe({
        next: this._toggleTheme
      });
  }

  private _toggleTheme(isDarkThemeSelected: boolean) {
    // These variables are injected by webpack
    // They are declared in src/webpack-injections.d.ts
    if (!__CSS_HMR_ENABLED__) {
      const styleFilename = isDarkThemeSelected ? __DARK_THEME_STYLE_FILENAME__ : __LIGHT_THEME_STYLE_FILENAME__;
      const link = document.head.querySelector<HTMLLinkElement>('link[rel=stylesheet]:last-of-type');
      link.href = '/' + styleFilename;
    }
    localStorage.setItem('theme', isDarkThemeSelected ? 'dark' : 'light');
  }

  private _watchForLoggingEnablement() {
    this.enableLoggingFormControl.valueChanges()
      .subscribe({
        next: isOn => {
          if (this._isLoggingEnabled !== this.enableLoggingFormControl.getValue()) {
            ConfirmationDialog.open('This will reload the browser, do you wish to continue?')
              .then(() => {
                this._isLoggingEnabled = isOn;
                location.reload();
                localStorage.setItem('isLoggingEnabled', String(isOn));
              })
              .catch(() => {
                // Reset it back
                this.enableLoggingFormControl.setValue(this._isLoggingEnabled);
              });
          }
        }
      });
  }

  componentWillUnmount() {
    this.isDarkThemeSelectedFormControl.cleanup();
    this.enableLoggingFormControl.cleanup();
  }

  render() {
    return (
      <div
        ref={this.menuOpenerRef}
        className='settings'>
        <Tooltip content='Settings'>
          <IconButton
            rounded
            hasBackground={false}
            className='settings__trigger'
            icon='more_vert'
            size='large'
            rippleDuration={1250}
            onClick={this.showSettingsMenu} />
        </Tooltip>
      </div>
    );
  }

  showSettingsMenu() {
    this.setState({
      showSettingsMenu: true
    });
    const settingsMenu = (
      <Fade in={this.state.showSettingsMenu}>
        <ul className='settings__menu'>
          <li className='settings__menu__item'>
            <div className='settings__menu__item__name'>
              Theme
            </div>
            <div className='settings__menu__item__action'>
              <SlideToggle
                className='theme-toggler'
                direction='horizontal'
                onText='Dark'
                offText='Light'
                formControlModel={this.isDarkThemeSelectedFormControl} />
            </div>
          </li>
          <li className='settings__menu__item'>
            <div className='settings__menu__item__name'>
              Logging
            </div>
            <div className='settings__menu__item__action toggle-logging'>
              <SlideToggle
                className='theme-toggler'
                direction='horizontal'
                onText='On'
                offText='Off'
                formControlModel={this.enableLoggingFormControl} />
            </div>
          </li>
        </ul>
      </Fade>
    );
    const anchorBoundingBox = this.menuOpenerRef.current.getBoundingClientRect();
    Dialog.create(settingsMenu)
      .addClassName('settings-dialog')
      .dismissible()
      .transparentBackdrop()
      .open(anchorBoundingBox.left - 200, anchorBoundingBox.top + 15);
  }

}
