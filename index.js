'use strict';

var React = require('react-native');
var {
  View,
  StyleSheet,
  PanResponder,
  Animated
} = React;

var Overlay         = require('react-native-overlay');
var screen          = require('Dimensions').get('window');

var styles = StyleSheet.create({

  wrapper: {
    flex: 1,
    backgroundColor: "white"
  }

});

var Modal = React.createClass({

  propTypes: {
    isOpen: React.PropTypes.bool,
    swipeToClose: React.PropTypes.bool,
    swipeThreshold: React.PropTypes.number,
    onClosed: React.PropTypes.func,
    onOpened: React.PropTypes.func,
    onClosingState: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      isOpen: false,
      swipeToClose: true,
      swipeThreshold: 50,
      aboveStatusBar: true
    };
  },

  getInitialState: function () {
    return {
      position: new Animated.Value(screen.height),
      isAnimateClose: false,
      isAnimateOpen: false,
      swipeToClose: false
    };
  },

  animateOpen: function() {
    if (this.state.isAnimateClose) {
      this.state.animClose.stop();
      this.state.isAnimateClose = false;
    }

    this.state.isAnimateOpen = true;
    this.state.animOpen = Animated.spring(
      this.state.position,
      {
        toValue: 0,
        friction: 8
      }
    );
    this.state.animOpen.start(() => {
      this.state.isAnimateOpen = false;
      if (this.props.onOpened) this.props.onOpened();
    });
  },

  animateClose: function() {
    if (this.state.isAnimateOpen) {
      this.state.animOpen.stop();
      this.state.isAnimateOpen = false;
    }

    this.state.isAnimateClose = true;
    this.state.animClose = Animated.spring(
      this.state.position,
      {
        toValue: screen.height,
        friction: 10
      }
    );
    this.state.animClose.start(() => {
      this.state.isAnimateClose = false;
      this.setState({});
      if (this.props.onClosed) this.props.onClosed();
    });
  },

  createPanResponder: function() {
    var closingState = false;

    var onPanRelease = (evt, state) => {
      if (state.dy > this.props.swipeThreshold)
        this.animateClose();
      else
        this.animateOpen();
    };

    var animEvt = Animated.event([null, {dy: this.state.position}]);

    var onPanMove = (evt, state) => {
      var newClosingState = (state.dy > this.props.swipeThreshold) ? true : false;

      if (state.dy < 0) return;
      if (newClosingState != closingState && this.props.onClosingState)
        this.props.onClosingState(newClosingState);
      closingState = newClosingState;

      animEvt(evt, state);
    };

    this.state.pan = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: onPanMove,
      onPanResponderRelease: onPanRelease,
      onPanResponderTerminate: onPanRelease,
    });
  },

  componentWillReceiveProps: function(props) {
    if (props.isOpen && !this.state.isAnimateOpen) {
      this.animateOpen();
    }
    else if (!props.isOpen && !this.state.isAnimateClose)
      this.animateClose();

    if (props.swipeToClose != this.state.swipeToClose) {
      this.state.swipeToClose = props.swipeToClose;
      if (props.swipeToClose)
        this.createPanResponder();
      else
        this.state.pan = null;
    }
  },

  render: function() {
    var visible  = this.props.isOpen || this.state.isAnimateOpen || this.state.isAnimateClose;
    var pan = this.state.pan ? this.state.pan.panHandlers : {};

    return (
      <Overlay isVisible={visible} aboveStatusBar={this.props.aboveStatusBar}>
        <Animated.View style={[styles.wrapper, this.props.style, {transform: [{translateY: this.state.position}]} ]} {...pan}>
          {this.props.children}
        </Animated.View>
      </Overlay>
    );
  }

});

module.exports = Modal;