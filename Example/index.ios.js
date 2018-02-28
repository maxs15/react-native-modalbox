import React from 'react';

import { AppRegistry } from 'react-native';

import { Tester, TestHookStore } from 'cavy';
import specs from './specs';

import App from './app';

var testHookStore = new TestHookStore();

class Example extends React.Component {

  render() {
    return (
      <Tester specs={specs} store={testHookStore} waitTime={1000} sendReport>
        <App />
      </Tester>
    );
  }

}

AppRegistry.registerComponent('Example', () => Example);
