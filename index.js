'use strict';

var React = require('react');
var {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Easing,
  BackAndroid,
  Platform,
} = require('react-native');

var screen = Dimensions.get('window');

var styles = StyleSheet.create({

  wrapper: {
    backgroundColor: "white"
  },

  transparent: {
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

var ModalBox = React.createClass({

  propTypes: {
    isOpen: React.PropTypes.bool,
    isDisabled: React.PropTypes.bool,
    backdropPressToClose: React.PropTypes.bool,
    swipeToClose: React.PropTypes.bool,
    swipeThreshold: React.PropTypes.number,
    swipeArea: React.PropTypes.number,
    position: React.PropTypes.string,
    entry: React.PropTypes.string,
    backdrop: React.PropTypes.bool,
    backdropOpacity: React.PropTypes.number,
    backdropColor: React.PropTypes.string,
    backdropContent: React.PropTypes.element,
    animationDuration: React.PropTypes.number,
    backButtonClose: React.PropTypes.bool,

    onClosed: React.PropTypes.func,
    onOpened: React.PropTypes.func,
    onClosingState: React.PropTypes.func,
  },

  getDefaultProps: function () {
    return {
      backdropPressToClose: true,
      swipeToClose: true,
      swipeThreshold: 50,
      position: "center",
      backdrop: true,
      backdropOpacity: 0.5,
      backdropColor: "black",
      backdropContent: null,
      animationDuration: 400,
      backButtonClose: false
    };
  },

  getInitialState: function () {
    var position = this.props.entry === 'top' ? -screen.height : screen.height;
    return {
      position: new Animated.Value(position),
      backdropOpacity: new Animated.Value(0),
      isOpen: false,
      isAnimateClose: false,
      isAnimateOpen: false,
      swipeToClose: false,
      height: screen.height,
      width: screen.width,
      containerHeight: screen.height,
      containerWidth: screen.width,
      isInitialized: false
    };
  },

  onBackPress () {
      this.close()
      return true
  },

  componentWillMount: function() {
    this.createPanResponder();
    this.handleOpenning(this.props);
    
  },

  componentWillReceiveProps: function(props) {
    this.handleOpenning(props);
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
      this.state.positionDest = this.calculateModalPosition(this.state.containerHeight, this.state.containerWidth);
  
      this.state.animOpen = Animated.timing(
        this.state.position,
        {
          toValue: this.state.positionDest,
          duration: this.props.animationDuration,
          easing: Easing.elastic(0.8)
        }
      );
      this.state.animOpen.start(() => {
        this.state.isAnimateOpen = false;
        this.state.isOpen = true;
        if (this.props.onOpened) this.props.onOpened();
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
        duration: this.props.animationDuration
      }
    );
    this.state.animClose.start(() => {
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
    this.state.height = evt.nativeEvent.layout.height;
    this.state.width = evt.nativeEvent.layout.width;

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
      this.state.isInitialized = true;
      return;
    }

    var modalPosition = this.calculateModalPosition(height, width);
    var coords = {};

    // Fixing the position if the modal was already open or an animation was in progress
    if (this.state.isInitialized && (this.state.isOpen || this.state.isAnimateOpen || this.state.isAnimateClose)) {
      var position = this.state.isOpen ? modalPosition : this.state.containerHeight;

      // Checking if a animation was in progress
      if (this.state.isAnimateOpen) {
        position = modalPosition;
        this.stopAnimateOpen();
      } else if (this.state.isAnimateClose) {
        position = this.state.containerHeight;
        this.stopAnimateClose();
      }
      this.state.position.setValue(position);
      coords = {positionDest: position};
    }

    this.setState({
      isInitialized: true,
      containerHeight: height,
      containerWidth: width,
      ...coords
    });
  },

  /*
   * Render the backdrop element
   */
  renderBackdrop: function(size) {
    var backdrop  = [];

    if (this.props.backdrop) {
      backdrop = (
        <TouchableWithoutFeedback onPress={this.props.backdropPressToClose ? this.close : null}>
          <Animated.View style={[styles.absolute, size, {opacity: this.state.backdropOpacity}]}>
            <View style={[styles.absolute, {backgroundColor:this.props.backdropColor, opacity: this.props.backdropOpacity}]}/>
            {this.props.backdropContent || []}
          </Animated.View>
        </TouchableWithoutFeedback>
      );
    }

    return backdrop;
  },

  /*
   * Render the component
   */
  render: function() {
    var visible     = this.state.isOpen || this.state.isAnimateOpen || this.state.isAnimateClose;
    var size        = {height: this.state.containerHeight, width: this.state.containerWidth};
    var offsetX     = (this.state.containerWidth - this.state.width) / 2;
    var backdrop    = this.renderBackdrop(size);

    if (!visible) return <View/>

    return (
      <View style={[styles.transparent, styles.absolute]} pointerEvents={'box-none'} onLayout={this.onContainerLayout}>
        {backdrop}
        <Animated.View
         onLayout={this.onViewLayout}
         style={[styles.wrapper, size, this.props.style, {transform: [{translateY: this.state.position}, {translateX: offsetX}]} ]}
         {...this.state.pan.panHandlers}>
          {this.props.children}
        </Animated.View>
      </View>
    );
  },

  /****************** PUBLIC METHODS **********************/

  open: function() {
    if (this.props.isDisabled) return;
    if (!this.state.isAnimateOpen && (!this.state.isOpen || this.state.isAnimateClose)) {
      this.onViewLayoutCalculated = () => {
        this.setState({});
        this.animateOpen();
        if(this.props.backButtonClose && Platform.OS === 'android') BackAndroid.addEventListener('hardwareBackPress', this.onBackPress)
      };
      this.setState({isAnimateOpen : true});
    }
  },

  close: function() {
    if (this.props.isDisabled) return;
    if (!this.state.isAnimateClose && (this.state.isOpen || this.state.isAnimateOpen)) {
      delete this.onViewLayoutCalculated;
      this.animateClose();
      if(this.props.backButtonClose && Platform.OS === 'android') BackAndroid.removeEventListener('hardwareBackPress', this.onBackPress)
    }
  }


});

module.exports = ModalBox;
