import * as React from 'react';
import {Header} from './Header';
import {Link} from 'react-router';

export interface MainViewProps {content: React.Component<Object, Object>}
export interface MainViewState {}

import '../../css/MainView.scss';

export class MainView extends React.Component<MainViewProps, MainViewState> {

    render() {

        return <div className="main-view">
            <Header />

            {this.props.content}
        </div>
    }
}