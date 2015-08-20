# react-native-modalbox

A react native <Modal> component, easy, fully customizable, implementing the 'swipe down to close' feature.
Using the new react native [Animated](http://facebook.github.io/react-native/docs/animations.html#content) library.

## Preview
![](https://i.imgur.com/QTAYh81.gif)
![](http://i.imgur.com/3XULLt8.gif)

## Getting started

1. `npm install react-native-modalbox@latest --save`
2. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
3. Go to `node_modules` ➜ `react-native-modalbox` and add `RNModalbox.xcodeproj`
4. In XCode, in the project navigator, select your project. Add `libRNModalbox.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
5. Click `RNModalbox.xcodeproj` in the project navigator and go the `Build Settings` tab. Make sure 'All' is toggled on (instead of 'Basic'). Look for `Header Search Paths` and make sure it contains both `$(SRCROOT)/../react-native/React` and `$(SRCROOT)/../../React` - mark both as `recursive`.
5. Run your project (`Cmd+R`)

## Example
Check [index.ios.js](https://github.com/maxs15/react-native-modalbox/blob/master/Example/index.ios.js) in the Example folder.

## Properties

| Prop  | Default  | Type | Description |
| :------------ |:---------------:| :---------------:| :-----|
| isOpen | false | `bool` | Open/close the modal, optional, you can use the open/close methods instead  |
| swipeToClose | true | `bool` | Set to `true` to enable the swipe down to close feature |
| swipeThreshold | 50 | `number` | The threshold to reach in pixels to close the modal |
| aboveStatusBar | true | `bool` | If true the modal will appear above the status bar |
| position | center | `string` | Control the modal position using `top` or `center` or `bottom`
| backdrop | true | `bool` | Display a backdrop behind the modal
| backdropOpacity | 0.5| `bool` | Opacity of the backdrop
| backdropColor | black| `bool` | backgroundColor of the backdrop
| backdropContent | null| `ReactElement` | Add an element in the backdrop (a close button for example)

## Events

| Prop  | Params  | Description |
| :------------ |:---------------:| :---------------:|
| onClosed | - | When the modal is close and the animation is done |
| onOpened | - | When the modal is open and the animation is done |
| onClosingState | state `bool` | When the state of the swipe to close feature has changed (usefull to change the content of the modal, display a message for example) |

## Methods
These methods are optional, you can use the isOpen property instead
| Prop  | Params  | Description |
| :------------ |:---------------:| :---------------:|
| open | - | Open the modal |
| close | - | Close the modal |