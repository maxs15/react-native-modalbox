# react-native-modalbox

A react native <Modal> component, easy, fully customizable, implementing the 'swipe down to close' feature.
Using the new react native [Animated](http://facebook.github.io/react-native/docs/animations.html#content) library.

![](https://i.imgur.com/QTAYh81.gif)

## Getting started

1. `npm install react-native-modalbox@latest --save`
2. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
3. Go to `node_modules` ➜ `react-native-modalbox` and add `RNModalbox.xcodeproj`
4. In XCode, in the project navigator, select your project. Add `libRNModalbox.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
5. Click `RNModalbox.xcodeproj` in the project navigator and go the `Build Settings` tab. Make sure 'All' is toggled on (instead of 'Basic'). Look for `Header Search Paths` and make sure it contains both `$(SRCROOT)/../react-native/React` and `$(SRCROOT)/../../React` - mark both as `recursive`.
5. Run your project (`Cmd+R`)

## Usage

```javascript
var React     = require('react-native');
var Recorder  = require('react-native-modalbox');

var {
  View
} = React;

var Example = React.createClass({

  getInitialState: function() {
    return {
      isOpen: false,
      closingState: false
    }
  },

  open: function() {
    this.setState({isOpen: true});
  },

  close: function() {
    this.setState({isOpen: false});
  },

  onClosed: function() {
    console.log('the modal is closed');
    // If the modal has been closed with a swipe down, we change the state to hide the modal completely 
    if (this.state.isOpen != false)
      this.setState({isOpen: false});
  },

  onOpened: function() {
    console.log('the modal is opened');
  },

  onClosingState: function(state) {
    this.setState({closingState: state});
  },

  render: function() {
    var modalRelease = <View/>;

    if (this.state.closingState)
      modalRelease = <View><Text>Release To leave</Text></View>;

    return (
      <Modal
        style={styles.customModalStyle}
        isOpen={this.state.isOpen}
        swipeToClose={true}
        onClosed={this.onClosed}
        onOpened={this.onOpened}
        onClosingState={this.onClosingState}>
          {modalRelease}
          <Button icon={"cross"} style={styles.modalButton} onPress={this.close}/>
          <Text>I'm the content of the modal!</Text>
      </Modal>
    );
  }

});

AppRegistry.registerComponent('App', () => Example);
```

## Properties

| Prop  | Default  | Type | Description |
| :------------ |:---------------:| :---------------:| :-----|
| isOpen | false | `bool` | If `true`, the modal will show up |
| swipeToClose | true | `bool` | Set to `true` to enable the swipe down to close feature |
| swipeThreshold | 50 | `number` | The threshold to reach in pixels to close the modal |

## Events

| Prop  | Params  | Description |
| :------------ |:---------------:| :---------------:|
| onClosed | - | When the modal is close and the animation is done |
| onOpened | - | When the modal is open and the animation is done |
| onClosingState | state `bool` | When the state of the swipe to close feature has changed (usefull to change the content of the modal, display a message for example) |