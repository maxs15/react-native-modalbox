'use strict';

var React = require('react');
var PropTypes = require('prop-types');
var {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Easing,
  BackAndroid,
  BackHandler,
  Platform,
  Modal,
  Keyboard
} = require('react-native');

var createReactClass = require('create-react-class');

var BackButton = BackHandler || BackAndroid;

var screen = Dimensions.get('window');

var styles = StyleSheet.create({

  wrapper: {
    backgroundColor: "white"
  },

  transparent: {
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0)'
  },

  absolute: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }

});

var ModalBox = createReactClass({

  propTypes: {
    isOpen: PropTypes.bool,
    isDisabled: PropTypes.bool,
    startOpen: PropTypes.bool,
    backdropPressToClose: PropTypes.bool,
    swipeToClose: PropTypes.bool,
    swipeThreshold: PropTypes.number,
    swipeArea: PropTypes.number,
    position: PropTypes.string,
    entry: PropTypes.string,
    backdrop: PropTypes.bool,
    backdropOpacity: PropTypes.number,
    backdropColor: PropTypes.string,
    backdropContent: PropTypes.element,
    animationDuration: PropTypes.number,
    backButtonClose: PropTypes.bool,
    easing: PropTypes.func,
    easingOpen: PropTypes.func,
    easingClose: PropTypes.func,
    coverScreen: PropTypes.bool,
    keyboardTopOffset: PropTypes.number,

    onClosed: PropTypes.func,
    onOpened: PropTypes.func,
    onClosingState: PropTypes.func,
  },

  getDefaultProps: function () {
    return {
      startOpen: false,
      backdropPressToClose: true,
      swipeToClose: true,
      swipeThreshold: 50,
      position: "center",
      backdrop: true,
      backdropOpacity: 0.5,
      backdropColor: "black",
      backdropContent: null,
      animationDuration: 400,
      backButtonClose: false,
      easing: undefined,
      easingOpen: Easing.elastic(0.8),
      easingClose: Easing.inOut(Easing.ease),
      coverScreen: false,
      keyboardTopOffset: Platform.OS == 'ios' ? 22 : 0
    };
  },

  getInitialState: function () {
    var position = this.props.entry === 'top' ? -screen.height : screen.height;
    return {
      position: this.props.startOpen ? new Animated.Value(0) : new Animated.Value(position),
      backdropOpacity: new Animated.Value(0),
      isOpen: this.props.startOpen,
      isAnimateClose: false,
      isAnimateOpen: false,
      swipeToClose: false,
      height: screen.height,
      width: screen.width,
      containerHeight: screen.height,
      containerWidth: screen.width,
      isInitialized: false,
      keyboardOffset: 0
    };
  },

  onBackPress () {
    this.close()
    return true
  },

  componentWillMount: function() {
    this.createPanResponder();
    this.handleOpenning(this.props);
    // Needed for IOS because the keyboard covers the screen
    if (Platform.OS === 'ios') {
      this.subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', this.onKeyboardChange),
        Keyboard.addListener('keyboardDidHide', this.onKeyboardHide)
      ];
    }
  },

  componentWillUnmount: function() {
    if (this.subscriptions) this.subscriptions.forEach((sub) => sub.remove());
  },

  componentWillReceiveProps: function(props) {
     if(this.props.isOpen != props.isOpen){
        this.handleOpenning(props);
     }
  },

  handleOpenning: function(props) {
    if (typeof props.isOpen == "undefined") return;
    if (props.isOpen)
      this.open();
    else
      this.close();
  },

  /****************** ANIMATIONS **********************/

  /*
   * The keyboard is hidden (IOS only)
   */
  onKeyboardHide: function(evt) {
    this.state.keyboardOffset = 0;
  },

  /*
   * The keyboard frame changed, used to detect when the keyboard open, faster than keyboardDidShow (IOS only)
   */
  onKeyboardChange: function(evt) {
    if (!evt) return;
    if (!this.state.isOpen) return;
    var keyboardFrame = evt.endCoordinates;
    var keyboardHeight = this.state.containerHeight - keyboardFrame.screenY;

    this.state.keyboardOffset = keyboardHeight;
    this.animateOpen();
  },

  /*
   * Open animation for the backdrop, will fade in
   */
  animateBackdropOpen: function() {
    if (this.state.isAnimateBackdrop) {
      this.state.animBackdrop.stop();
      this.state.isAnimateBackdrop = false;
    }

    this.state.isAnimateBackdrop = true;
    this.state.animBackdrop = Animated.timing(
      this.state.backdropOpacity,
      {
        toValue: 1,
        duration: this.props.animationDuration
      }
    );
    this.state.animBackdrop.start(() => {
      this.state.isAnimateBackdrop = false;
    });
  },

  /*
   * Close animation for the backdrop, will fade out
   */
  animateBackdropClose: function() {
    if (this.state.isAnimateBackdrop) {
      this.state.animBackdrop.stop();
      this.state.isAnimateBackdrop = false;
    }

    this.state.isAnimateBackdrop = true;
    this.state.animBackdrop = Animated.timing(
      this.state.backdropOpacity,
      {
        toValue: 0,
        duration: this.props.animationDuration
      }
    );
    this.state.animBackdrop.start(() => {
      this.state.isAnimateBackdrop = false;
    });
  },

  /*
   * Stop opening animation
   */
  stopAnimateOpen: function() {
    if (this.state.isAnimateOpen) {
      if (this.state.animOpen) this.state.animOpen.stop();
      this.state.isAnimateOpen = false;
    }
  },

  /*
   * Open animation for the modal, will move up
   */
  animateOpen: function() {
    this.stopAnimateClose();

    // Backdrop fadeIn
    if (this.props.backdrop)
      this.animateBackdropOpen();

    this.state.isAnimateOpen = true;

    requestAnimationFrame(() => {
      // Detecting modal position
      this.state.positionDest = this.calculateModalPosition(this.state.containerHeight - this.state.keyboardOffset, this.state.containerWidth);
      if (this.state.keyboardOffset && (this.state.positionDest < this.props.keyboardTopOffset)) {
        this.state.positionDest = this.props.keyboardTopOffset;
      }
      this.state.animOpen = Animated.timing(
        this.state.position,
        {
          toValue: this.state.positionDest,
          duration: this.props.animationDuration,
          easing: this.props.easing || this.props.easingOpen,
        }
      );
      this.state.animOpen.start(() => {
        if (!this.state.isOpen && this.props.onOpened) this.props.onOpened();
        this.state.isAnimateOpen = false;
        this.state.isOpen = true;
      });
    })

  },

  /*
   * Stop closing animation
   */
  stopAnimateClose: function() {
    if (this.state.isAnimateClose) {
      if (this.state.animClose) this.state.animClose.stop();
      this.state.isAnimateClose = false;
    }
  },

  /*
   * Close animation for the modal, will move down
   */
  animateClose: function() {
    this.stopAnimateOpen();

    // Backdrop fadeout
    if (this.props.backdrop)
      this.animateBackdropClose();

    this.state.isAnimateClose = true;
    this.state.animClose = Animated.timing(
      this.state.position,
      {
        toValue: this.props.entry === 'top' ? -this.state.containerHeight : this.state.containerHeight,
        duration: this.props.animationDuration,
        easing: this.props.easingClose
      }
    );
    this.state.animClose.start(() => {
      Keyboard.dismiss();
      this.state.isAnimateClose = false;
      this.state.isOpen = false;
      this.setState({});
      if (this.props.onClosed) this.props.onClosed();
    });
  },

  /*
   * Calculate when should be placed the modal
   */
  calculateModalPosition: function(containerHeight, containerWidth) {
    var position = 0;

    if (this.props.position == "bottom") {
      position = containerHeight - this.state.height;
    }
    else if (this.props.position == "center") {
      position = containerHeight / 2 - this.state.height / 2;
    }
    // Checking if the position >= 0
    if (position < 0) position = 0;
    return position;
  },

  /*
   * Create the pan responder to detect gesture
   * Only used if swipeToClose is enabled
   */
  createPanResponder: function() {
    var closingState = false;
    var inSwipeArea  = false;

    var onPanRelease = (evt, state) => {
      if (!inSwipeArea) return;
      inSwipeArea = false;
      if (this.props.entry === 'top' ? -state.dy > this.props.swipeThreshold : state.dy > this.props.swipeThreshold)
        this.animateClose();
      else
        this.animateOpen();
    };

    var animEvt = Animated.event([null, {customY: this.state.position}]);

    var onPanMove = (evt, state) => {
      var newClosingState = this.props.entry === 'top' ? -state.dy > this.props.swipeThreshold : state.dy > this.props.swipeThreshold;
      if (this.props.entry === 'top' ? state.dy > 0 : state.dy < 0) return;
      if (newClosingState != closingState && this.props.onClosingState)
        this.props.onClosingState(newClosingState);
      closingState = newClosingState;
      state.customY = state.dy + this.state.positionDest;

      animEvt(evt, state);
    };

    var onPanStart = (evt, state) => {
      if (!this.props.swipeToClose || this.props.isDisabled || (this.props.swipeArea && (evt.nativeEvent.pageY - this.state.positionDest) > this.props.swipeArea)) {
        inSwipeArea = false;
        return false;
      }
      inSwipeArea = true;
      return true;
    };

    this.state.pan = PanResponder.create({
      onStartShouldSetPanResponder: onPanStart,
      onPanResponderMove: onPanMove,
      onPanResponderRelease: onPanRelease,
      onPanResponderTerminate: onPanRelease,
    });
  },

  /*
   * Event called when the modal view layout is calculated
   */
  onViewLayout: function(evt) {
    var height = evt.nativeEvent.layout.height;
    var width = evt.nativeEvent.layout.width;

    // If the dimensions are still the same we're done
    let newState = {};
    if (height !== this.state.height) newState.height = height;
    if (width !== this.state.width) newState.width = width;
    this.setState(newState);

    if (this.onViewLayoutCalculated) this.onViewLayoutCalculated();
  },

  /*
   * Event called when the container view layout is calculated
   */
  onContainerLayout: function(evt) {
    var height = evt.nativeEvent.layout.height;
    var width = evt.nativeEvent.layout.width;

    // If the container size is still the same we're done
    if (height == this.state.containerHeight && width == this.state.containerWidth) {
      this.setState({ isInitialized: true });
      return;
    }

    if (this.state.isOpen || this.state.isAnimateOpen) {
      this.animateOpen();
    }

    if (this.props.onLayout) this.props.onLayout(evt);
    this.setState({
      isInitialized: true,
      containerHeight: height,
      containerWidth: width
    });
  },

  /*
   * Render the backdrop element
   */
  renderBackdrop: function() {
    var backdrop  = null;

    if (this.props.backdrop) {
      backdrop = (
        <TouchableWithoutFeedback onPress={this.props.backdropPressToClose ? this.close : null}>
          <Animated.View style={[styles.absolute, {opacity: this.state.backdropOpacity}]}>
            <View style={[styles.absolute, {backgroundColor:this.props.backdropColor, opacity: this.props.backdropOpacity}]}/>
            {this.props.backdropContent || []}
          </Animated.View>
        </TouchableWithoutFeedback>
      );
    }

    return backdrop;
  },

  renderContent() {
    var size    = {height: this.state.containerHeight, width: this.state.containerWidth};
    var offsetX = (this.state.containerWidth - this.state.width) / 2;

    return (
      <Animated.View
        onLayout={this.onViewLayout}
        style={[styles.wrapper, size, this.props.style, {transform: [{translateY: this.state.position}, {translateX: offsetX}]} ]}
        {...this.state.pan.panHandlers}>
        {this.props.children}
      </Animated.View>
    )
  },

  /*
   * Render the component
   */
  render: function() {
    var visible = this.state.isOpen || this.state.isAnimateOpen || this.state.isAnimateClose;

    if (!visible) return <View/>

    var content = (
      <View style={[styles.transparent, styles.absolute]} pointerEvents={'box-none'}>
        <View style={{ flex: 1 }} pointerEvents={'box-none'} onLayout={this.onContainerLayout}>
          {visible && this.renderBackdrop()}
          {visible && this.renderContent()}
        </View>
      </View>
    )

    if (!this.props.coverScreen) return content;

    return (
      <Modal onRequestClose={() => this.close()} supportedOrientations={['landscape', 'portrait']} transparent visible={visible}>
        {content}
      </Modal>
    );
  },

  /****************** PUBLIC METHODS **********************/

  open: function() {
    if (this.props.isDisabled) return;
    if (!this.state.isAnimateOpen && (!this.state.isOpen || this.state.isAnimateClose)) {
      this.onViewLayoutCalculated = () => {
        this.setState({});
        this.animateOpen();
        if(this.props.backButtonClose && Platform.OS === 'android') BackButton.addEventListener('hardwareBackPress', this.onBackPress)
        delete this.onViewLayoutCalculated;
      };
      this.setState({isAnimateOpen : true});
    }
  },

  close: function() {
    if (this.props.isDisabled) return;
    if (!this.state.isAnimateClose && (this.state.isOpen || this.state.isAnimateOpen)) {
      this.animateClose();
      if(this.props.backButtonClose && Platform.OS === 'android') BackButton.removeEventListener('hardwareBackPress', this.onBackPress)
    }
  }


});

module.exports = ModalBox;
