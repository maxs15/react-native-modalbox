import React from "react";
import PropTypes from "prop-types";
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Easing,
  BackHandler,
  Platform,
  Modal,
  Keyboard
} from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "white"
  },
  transparent: {
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0)"
  },
  absolute: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
});

export default class ModalBox extends React.PureComponent {
  static propTypes = {
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
    coverScreen: PropTypes.bool,
    keyboardTopOffset: PropTypes.number,
    onClosed: PropTypes.func,
    onOpened: PropTypes.func,
    onClosingState: PropTypes.func
  };

  static defaultProps = {
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
    easing: Easing.elastic(0.8),
    coverScreen: false,
    keyboardTopOffset: Platform.OS == "ios" ? 22 : 0,
    useNativeDriver: true
  };

  constructor(props) {
    super(props);

    this.onBackPress = this.onBackPress.bind(this);
    this.handleOpenning = this.handleOpenning.bind(this);
    this.onKeyboardHide = this.onKeyboardHide.bind(this);
    this.onKeyboardChange = this.onKeyboardChange.bind(this);
    this.animateBackdropOpen = this.animateBackdropOpen.bind(this);
    this.animateBackdropClose = this.animateBackdropClose.bind(this);
    this.stopAnimateOpen = this.stopAnimateOpen.bind(this);
    this.animateOpen = this.animateOpen.bind(this);
    this.stopAnimateClose = this.stopAnimateClose.bind(this);
    this.animateClose = this.animateClose.bind(this);
    this.calculateModalPosition = this.calculateModalPosition.bind(this);
    this.createPanResponder = this.createPanResponder.bind(this);
    this.onViewLayout = this.onViewLayout.bind(this);
    this.onContainerLayout = this.onContainerLayout.bind(this);
    this.renderBackdrop = this.renderBackdrop.bind(this);
    this.renderContent = this.renderContent.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);

    const position = props.startOpen
      ? new Animated.Value(0)
      : new Animated.Value(
          props.entry === "top" ? -SCREEN_HEIGHT : SCREEN_HEIGHT
        );
    const flattenedPropsStyle = StyleSheet.flatten(this.props.style);
    this.state = {
      position,
      backdropOpacity: new Animated.Value(0),
      isOpen: props.startOpen,
      isAnimateClose: false,
      isAnimateOpen: false,
      swipeToClose: false,
      height:
        (this.props.style &&
          flattenedPropsStyle &&
          flattenedPropsStyle.height) ||
        SCREEN_HEIGHT,
      width: SCREEN_WIDTH,
      containerHeight: SCREEN_HEIGHT,
      containerWidth: SCREEN_WIDTH,
      isInitialized: false,
      keyboardOffset: 0,
      pan: this.createPanResponder(position),
      hideContent: false
    };

    // Needed for iOS because the keyboard covers the screen
    if (Platform.OS === "ios") {
      this.subscriptions = [
        Keyboard.addListener("keyboardWillChangeFrame", this.onKeyboardChange),
        Keyboard.addListener("keyboardDidHide", this.onKeyboardHide)
      ];
    }
  }

  componentDidMount() {
    this.handleOpenning();
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOpen != prevProps.isOpen) {
      this.handleOpenning();
    }
    if (this.props.style && this.props.isOpen) {
      const nextFlattenedPropsStyle = StyleSheet.flatten(this.props.style);
      const flattenedPropsStyle = StyleSheet.flatten(prevProps.style);
      if (
        nextFlattenedPropsStyle &&
        nextFlattenedPropsStyle !== flattenedPropsStyle
      ) {
        const nextHeight = nextFlattenedPropsStyle.height;
        const prevHeight = flattenedPropsStyle.height;
        if (
          nextHeight !== prevHeight &&
          !this.state.isAnimateOpen &&
          !this.state.isAnimateClose
        ) {
          let positionDest = this.calculateModalPosition(
            this.state.containerHeight,
            this.state.containerWidth,
            nextHeight
          );
          if (nextHeight > prevHeight) {
            this.setState(
              { height: nextHeight, containerHeight: SCREEN_HEIGHT },
              () => {
                this.animateOpen({ positionDest });
              }
            );
          } else {
            this.setState({ containerHeight: SCREEN_HEIGHT }, () => {
              this.animateOpen({
                positionDest,
                callback: () => {
                  this.setState({
                    height: nextHeight
                  });
                }
              });
            });
          }
        } else {
          this.setState({ height: nextHeight, containerHeight: SCREEN_HEIGHT });
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.subscriptions) this.subscriptions.forEach(sub => sub.remove());
    if (this.props.backButtonClose && Platform.OS === "android")
      BackHandler.removeEventListener("hardwareBackPress", this.onBackPress);
  }

  onBackPress() {
    this.close();
    return true;
  }

  handleOpenning() {
    if (typeof this.props.isOpen == "undefined") return;
    if (this.props.isOpen) this.open();
    else this.close();
  }

  /****************** ANIMATIONS **********************/

  /*
   * The keyboard is hidden (IOS only)
   */
  onKeyboardHide(evt) {
    this.setState({ keyboardOffset: 0 });
  }

  /*
   * The keyboard frame changed, used to detect when the keyboard open, faster than keyboardDidShow (IOS only)
   */
  onKeyboardChange(evt) {
    if (!evt) return;
    if (!this.state.isOpen) return;
    const keyboardFrame = evt.endCoordinates;
    const keyboardHeight = this.state.containerHeight - keyboardFrame.screenY;

    this.setState({ keyboardOffset: keyboardHeight }, () => {
      if (!this.state.isAnimateOpen) this.animateOpen();
    });
  }

  /*
   * Open animation for the backdrop, will fade in
   */
  animateBackdropOpen() {
    if (this.state.isAnimateBackdrop && this.state.animBackdrop) {
      this.state.animBackdrop.stop();
    }
    this.setState({ isAnimateBackdrop: true });

    let animBackdrop = Animated.timing(this.state.backdropOpacity, {
      toValue: 1,
      duration: this.props.animationDuration,
      easing: this.props.easing,
      useNativeDriver: this.props.useNativeDriver
    }).start(() => {
      this.setState({
        isAnimateBackdrop: false,
        animBackdrop
      });
    });
  }

  /*
   * Close animation for the backdrop, will fade out
   */
  animateBackdropClose() {
    if (this.state.isAnimateBackdrop && this.state.animBackdrop) {
      this.state.animBackdrop.stop();
    }
    this.setState({ isAnimateBackdrop: true });

    let animBackdrop = Animated.timing(this.state.backdropOpacity, {
      toValue: 0,
      duration: this.props.animationDuration,
      easing: this.props.easing,
      useNativeDriver: this.props.useNativeDriver
    }).start(() => {
      this.setState({
        isAnimateBackdrop: false,
        animBackdrop
      });
    });
  }

  /*
   * Stop opening animation
   */
  stopAnimateOpen() {
    if (this.state.isAnimateOpen) {
      if (this.state.animOpen) this.state.animOpen.stop();
      this.setState({ isAnimateOpen: false });
    }
  }

  /*
   * Open animation for the modal, will move up
   */
  animateOpen(config) {
    this.stopAnimateClose();

    // Backdrop fadeIn
    if (this.props.backdrop) this.animateBackdropOpen();
    this.setState(
      {
        isAnimateOpen: true,
        isOpen: true
      },
      () => {
        requestAnimationFrame(() => {
          let positionDest =
            (config && config.positionDest) ||
            this.calculateModalPosition(
              this.state.containerHeight - this.state.keyboardOffset,
              this.state.containerWidth
            );
          let animOpen = Animated.timing(this.state.position, {
            toValue: positionDest,
            duration: this.props.animationDuration,
            easing: this.props.easing,
            useNativeDriver: this.props.useNativeDriver
          }).start(() => {
            this.setState(
              {
                isAnimateOpen: false,
                animOpen,
                positionDest
              },
              () => config && config.callback && config.callback()
            );
            if (this.props.onOpened) this.props.onOpened();
          });
        });
      }
    );
  }

  /*
   * Stop closing animation
   */
  stopAnimateClose() {
    if (this.state.isAnimateClose) {
      if (this.state.animClose) this.state.animClose.stop();
      this.setState({ hideContent: true }, () =>
        this.setState({ isAnimateClose: false }, () => {
          this.setState({ hideContent: false });
        })
      );
    }
  }

  /*
   * Close animation for the modal, will move down
   */
  animateClose() {
    this.stopAnimateOpen();

    // Backdrop fadeout
    if (this.props.backdrop) this.animateBackdropClose();

    this.setState(
      {
        isAnimateClose: true,
        isOpen: false
      },
      () => {
        let animClose = Animated.timing(this.state.position, {
          toValue:
            this.props.entry === "top"
              ? -this.state.containerHeight
              : this.state.containerHeight,
          duration: this.props.animationDuration,
          easing: this.props.easing,
          useNativeDriver: this.props.useNativeDriver
        }).start(() => {
          // Keyboard.dismiss();   // make this optional. Easily user defined in .onClosed() callback
          this.setState({ hideContent: true }, () => {
            this.setState(
              {
                isAnimateClose: false,
                animClose
              },
              () => {
                this.setState({ hideContent: false });
                /* Set the state to the starting position of the modal, preventing from animating where the swipe stopped */
                this.state.position.setValue(
                  this.props.entry === "top"
                    ? -this.state.containerHeight
                    : this.state.containerHeight
                );
              }
            );
          });
          if (this.props.onClosed) this.props.onClosed();
        });
      }
    );
  }

  /*
   * Calculate when should be placed the modal
   */
  calculateModalPosition(containerHeight, containerWidth, nextHeight) {
    let position = 0;

    if (this.props.position == "bottom") {
      position = containerHeight - (nextHeight || this.state.height);
    } else if (this.props.position == "center") {
      position = containerHeight / 2 - (nextHeight || this.state.height) / 2;
    }
    // Checking if the position >= 0
    if (position < 0) position = 0;
    return position;
  }

  /*
   * Create the pan responder to detect gesture
   * Only used if swipeToClose is enabled
   */
  createPanResponder(position) {
    let closingState = false;
    let inSwipeArea = false;

    const onPanStart = (evt, state) => {
      if (
        !this.props.swipeToClose ||
        this.props.isDisabled ||
        (this.props.swipeArea &&
          evt.nativeEvent.pageY - this.state.positionDest >
            this.props.swipeArea)
      ) {
        inSwipeArea = false;
        return false;
      }
      inSwipeArea = true;
      return true;
    };

    const animEvt = Animated.event([null, { customY: position }]);

    const onPanMove = (evt, state) => {
      const newClosingState =
        this.props.entry === "top"
          ? -state.dy > this.props.swipeThreshold
          : state.dy > this.props.swipeThreshold;
      if (this.props.entry === "top" ? state.dy > 0 : state.dy < 0) return;
      if (newClosingState != closingState && this.props.onClosingState)
        this.props.onClosingState(newClosingState);
      closingState = newClosingState;
      state.customY = state.dy + this.state.positionDest;

      animEvt(evt, state);
    };

    const onPanRelease = (evt, state) => {
      if (!inSwipeArea) return;
      inSwipeArea = false;
      if (
        this.props.entry === "top"
          ? -state.dy > this.props.swipeThreshold
          : state.dy > this.props.swipeThreshold
      ) {
        this.close();
      } else if (!this.state.isOpen) {
        this.animateOpen();
      }
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: onPanStart,
      onPanResponderMove: onPanMove,
      onPanResponderRelease: onPanRelease,
      onPanResponderTerminate: onPanRelease
    });
  }

  /*
   * Event called when the modal view layout is calculated
   */
  onViewLayout(evt) {
    const height = evt.nativeEvent.layout.height;
    const width = evt.nativeEvent.layout.width;
    // If the dimensions are still the same we're done
    let newState = {};
    if (height !== this.state.height) newState.height = height;
    if (width !== this.state.width) newState.width = width;
    this.setState(newState);

    if (this.onViewLayoutCalculated) this.onViewLayoutCalculated();
  }

  /*
   * Event called when the container view layout is calculated
   */
  onContainerLayout(evt) {
    const height = evt.nativeEvent.layout.height;
    const width = evt.nativeEvent.layout.width;
    // If the container size is still the same we're done
    if (
      height == this.state.containerHeight &&
      width == this.state.containerWidth
    ) {
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
  }

  /*
   * Render the backdrop element
   */
  renderBackdrop() {
    let backdrop = null;

    if (this.props.backdrop) {
      backdrop = (
        <TouchableWithoutFeedback
          onPress={this.props.backdropPressToClose ? this.close : null}
        >
          <Animated.View
            importantForAccessibility="no"
            style={[styles.absolute, { opacity: this.state.backdropOpacity }]}
          >
            <View
              style={[
                styles.absolute,
                {
                  backgroundColor: this.props.backdropColor,
                  opacity: this.props.backdropOpacity
                }
              ]}
            />
            {this.props.backdropContent || []}
          </Animated.View>
        </TouchableWithoutFeedback>
      );
    }

    return backdrop;
  }

  renderContent() {
    const size = {
      height: this.state.containerHeight,
      width: this.state.containerWidth
    };
    const offsetX = (this.state.containerWidth - this.state.width) / 2;

    return (
      <Animated.View
        onLayout={this.onViewLayout}
        style={[
          styles.wrapper,
          size,
          this.props.style,
          {
            height: this.state.height,
            width: this.state.width
          },
          {
            transform: [
              { translateY: this.state.position },
              { translateX: offsetX }
            ]
          }
        ]}
        {...this.state.pan.panHandlers}
      >
        {this.props.children}
      </Animated.View>
    );
  }

  /*
   * Render the component
   */
  render() {
    const visible =
      this.state.isOpen ||
      this.state.isAnimateOpen ||
      this.state.isAnimateClose;

    if (!visible) return <View />;

    const content = (
      <View
        importantForAccessibility="yes"
        accessibilityViewIsModal={true}
        style={[styles.transparent, styles.absolute]}
        pointerEvents={"box-none"}
      >
        <View
          style={{ flex: 1 }}
          pointerEvents={"box-none"}
          onLayout={this.onContainerLayout}
        >
          {visible && this.renderBackdrop()}
          {visible && this.renderContent()}
        </View>
      </View>
    );

    if (!this.props.coverScreen) return content;

    return (
      <Modal
        onRequestClose={() => {
          if (this.props.backButtonClose) {
            this.close();
          }
        }}
        supportedOrientations={[
          "landscape",
          "portrait",
          "portrait-upside-down"
        ]}
        transparent
        visible={visible}
        hardwareAccelerated={true}
      >
        {this.state.hideContent ? null : content}
      </Modal>
    );
  }

  /****************** PUBLIC METHODS **********************/

  open() {
    if (this.props.isDisabled) return;
    if (
      !this.state.isAnimateOpen &&
      (!this.state.isOpen || this.state.isAnimateClose)
    ) {
      this.onViewLayoutCalculated = () => {
        this.animateOpen();
        if (this.props.backButtonClose && Platform.OS === "android")
          BackHandler.addEventListener("hardwareBackPress", this.onBackPress);
        this.onViewLayoutCalculated = null;
      };
      this.setState({ isAnimateOpen: true });
    }
  }

  close() {
    if (this.props.isDisabled) return;
    if (
      !this.state.isAnimateClose &&
      (this.state.isOpen || this.state.isAnimateOpen)
    ) {
      this.animateClose();
      if (this.props.backButtonClose && Platform.OS === "android")
        BackHandler.removeEventListener("hardwareBackPress", this.onBackPress);
    }
  }
}
