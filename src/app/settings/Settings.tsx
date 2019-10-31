import * as React from 'react';

import { IconButton } from '@shared/buttons';
import { Tooltip } from '@shared/tooltip';
import { SlideToggle } from '@shared/form';
import { Fade } from '@shared/fade';
import { PopUp } from '@shared/pop-up';

import './Settings.light.scss';
import './Settings.dark.scss';

interface Props {
}

interface State {
  showSettingsMenu: boolean;
  top: number;
  left: number;
  themeSelectedPreviously: 'light' | 'dark';
}

const menuWidth = 270;

export class Settings extends React.Component<Props, State> {

  settingsMenuAnchor: HTMLElement;
  settingsMenuContainer = document.createElement('div');

  constructor(props: Props) {
    super(props);

    this.state = {
      showSettingsMenu: false,
      top: 0,
      left: 0,
      themeSelectedPreviously: this._getPreviouslySelectedTheme()
    };
    this.settingsMenuContainer.className = 'settings-menu-container';
    document.body.appendChild(this.settingsMenuContainer);

    this.showSettingsMenu = this.showSettingsMenu.bind(this);
    this.hideSettingsMenu = this.hideSettingsMenu.bind(this);
  }

  private _getPreviouslySelectedTheme() {
    const selectedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    return selectedTheme ? selectedTheme : __DEFAULT_SELECTED_THEME__;
  }

  componentDidMount() {
    const boundingBox = this.settingsMenuAnchor.getBoundingClientRect();
    this.setState({
      left: boundingBox.left - menuWidth,
      top: boundingBox.top
    });
    if (this.state.themeSelectedPreviously !== 'dark')
      setTimeout(() => {
        this.toggleTheme(this.state.themeSelectedPreviously === 'dark');
      }, 16);
  }

  toggleTheme(isDarkThemeSelected: boolean) {
    // These variables are injected by webpack
    // They are declared in src/webpack-injections.d.ts
    const styleFilename = isDarkThemeSelected ? __DARK_THEME_STYLE_FILENAME__ : __LIGHT_THEME_STYLE_FILENAME__;
    const link = document.head.querySelector('link[rel=stylesheet]') as HTMLLinkElement;
    link.href = styleFilename;
    localStorage.setItem('theme', isDarkThemeSelected ? 'dark' : 'light');
  }

  componentWillMount() {
    document.body.removeChild(this.settingsMenuContainer);
  }

  render() {
    return (
      <section
        ref={ref => this.settingsMenuAnchor = ref}
        className='settings'>
        <Tooltip content='Settings'>
          <IconButton
            className='settings__trigger'
            icon='more_vert'
            noBackground={true}
            size='large'
            rounded={true}
            rippleDuration={1250}
            onClick={this.showSettingsMenu} />
        </Tooltip>
        <PopUp
          in={this.state.showSettingsMenu}
          top={this.state.top}
          left={this.state.left}
          onBackdropClicked={this.hideSettingsMenu}>
          <Fade in={this.state.showSettingsMenu}>
            <ul
              className='settings__menu'
              style={{
                width: menuWidth
              }}>
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
                    isOn={this.state.themeSelectedPreviously === 'dark'}
                    onChange={this.toggleTheme} />
                </div>
              </li>
            </ul>
          </Fade>
        </PopUp>
      </section>
    );
  }

  showSettingsMenu() {
    this.setState({
      showSettingsMenu: true
    });
  }

  hideSettingsMenu() {
    this.setState({
      showSettingsMenu: false
    });
  }

}
