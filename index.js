'use strict';

var React = require('react-native');
var {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  Dimensions
} = React;

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
    swipeToClose: React.PropTypes.bool,
    swipeThreshold: React.PropTypes.number,
    swipeArea: React.PropTypes.number,
    position: React.PropTypes.string,
    backdrop: React.PropTypes.bool,
    backdropOpacity: React.PropTypes.number,
    backdropColor: React.PropTypes.string,
    backdropContent: React.PropTypes.element,
    backdropCloseOnPress: React.PropTypes.bool,

    onClosed: React.PropTypes.func,
    onOpened: React.PropTypes.func,
    onClosingState: React.PropTypes.func,
  },

  getDefaultProps: function () {
    return {
      swipeToClose: true,
      swipeThreshold: 50,
      position: "center",
      backdrop: true,
      backdropOpacity: 0.5,
      backdropColor: "black",
      backdropContent: null,
      backdropCloseOnPress: true,
    };
  },

  getInitialState: function () {
    return {
      position: new Animated.Value(screen.height),
      backdropOpacity: new Animated.Value(0),
      isOpen: false,
      isAnimateClose: false,
      isAnimateOpen: false,
      swipeToClose: false,
      height: screen.height,
      width: screen.width
    };
  },

  componentDidMount: function() {
    if (this.props.swipeToClose)
      this.createPanResponder();
  },

  componentWillReceiveProps: function(props) {
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
        toValue: 1
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
        toValue: 0
      }
    );
    this.state.animBackdrop.start(() => {
      this.state.isAnimateBackdrop = false;
    });
  },

  /*
   * Open animation for the modal, will move up
   */
  animateOpen: function() {
    if (this.state.isAnimateClose) {
      this.state.animClose.stop();
      this.state.isAnimateClose = false;
    }

    // Backdrop fadeIn
    if (this.props.backdrop)
      this.animateBackdropOpen();

    // Detecting modal position
    this.state.positionDest = 0;
    if (this.props.position == "bottom") {
      this.state.positionDest = screen.height - this.state.height;
    }
    else if (this.props.position == "center") {
      this.state.positionDest = screen.height / 2 - this.state.height / 2;
    }

    this.state.isAnimateOpen = true;
    this.state.animOpen = Animated.spring(
      this.state.position,
      {
        toValue: this.state.positionDest,
        friction: 8
      }
    );
    this.state.animOpen.start(() => {
      this.state.isAnimateOpen = false;
      this.state.isOpen = true;
      if (this.props.onOpened) this.props.onOpened();
    });
  },

  /*
   * Close animation for the modal, will move down 
   */
  animateClose: function() {
    if (this.state.isAnimateOpen) {
      this.state.animOpen.stop();
      this.state.isAnimateOpen = false;
    }

    // Backdrop fadeout
    if (this.props.backdrop)
      this.animateBackdropClose();

    this.state.isAnimateClose = true;
    this.state.animClose = Animated.timing(
      this.state.position,
      {
        toValue: screen.height,
        duration: 400
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
   * Create the pan responder to detect gesture
   * Only used if swipeToClose is enabled
   */
  createPanResponder: function() {
    var closingState = false;
    var inSwipeArea  = true;

    var onPanRelease = (evt, state) => {
      if (!inSwipeArea) return;
      if (state.dy > this.props.swipeThreshold)
        this.animateClose();
      else
        this.animateOpen();
    };

    var animEvt = Animated.event([null, {customY: this.state.position}]);

    var onPanMove = (evt, state) => {
      var newClosingState = (state.dy > this.props.swipeThreshold) ? true : false;
      if (state.dy < 0) return;
      if (newClosingState != closingState && this.props.onClosingState)
        this.props.onClosingState(newClosingState);
      closingState = newClosingState;
      state.customY = state.dy + this.state.positionDest;

      animEvt(evt, state);
    };

    var onPanStart = (evt, state) => {
      if (this.props.isDisabled || (this.props.swipeArea && (evt.nativeEvent.pageY - this.state.positionDest) > this.props.swipeArea)) {
        inSwipeArea = false;
        return false;
      }
      inSwipeArea = true;
      return true;
    };
    
    /* Fix 3d touch bug related issue https://github.com/facebook/react-native/issues/3082*/
    var onPanShouldMove = (evt, state) => {
      if (state.dx === 0 || state.dy === 0) {
        return false;
      }
      return inSwipeArea;
    };

    this.state.pan = PanResponder.create({
      onStartShouldSetPanResponder: onPanStart,
      onMoveShouldSetPanResponder: onPanShouldMove,
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
   * Render the backdrop element 
   */
  renderBackdrop: function() {
    var backdrop  = [];
    var size      = {height: screen.height, width: screen.width};

    if (this.props.backdrop) {
      var backdropOnPress = this.props.backdropCloseOnPress ? this.close : false;
      backdrop = (
        <TouchableWithoutFeedback onPress={backdropOnPress}>
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
    var pan         = this.state.pan ? this.state.pan.panHandlers : {};
    var offsetX     = (screen.width - this.state.width) / 2;
    var backdrop    = this.renderBackdrop();

    if (!visible) return <View/>

    return (
      <View style={[styles.transparent, styles.absolute]} pointerEvents={'box-none'}>
        {backdrop}
        <Animated.View
         onLayout={this.onViewLayout}
         style={[styles.wrapper, {height: screen.height, width: screen.width}, this.props.style, {transform: [{translateY: this.state.position}, {translateX: offsetX}]} ]}
         {...pan}>
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
      };
      this.setState({isAnimateOpen : true});
    }
  },

  close: function() {
    if (this.props.isDisabled) return;
    if (!this.state.isAnimateClose && (this.state.isOpen || this.state.isAnimateOpen)) {
      this.animateClose();
    }
  }


});

module.exports = ModalBox;
