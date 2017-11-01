const React = require('react')
const PropTypes = require('prop-types')
const {
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
  Keyboard,
} = require('react-native')

const createReactClass = require('create-react-class')

const BackButton = BackHandler || BackAndroid

const screen = Dimensions.get('window')

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'white',
  },

  transparent: {
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0)',
  },

  absolute: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
})
/* eslint react/prefer-es6-class: 0 */
const ModalBox = createReactClass({
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
    coverScreen: PropTypes.bool,
    keyboardTopOffset: PropTypes.number,

    onClosed: PropTypes.func,
    onOpened: PropTypes.func,
    onClosingState: PropTypes.func,
  },

  getDefaultProps() {
    return {
      startOpen: false,
      backdropPressToClose: true,
      swipeToClose: true,
      swipeThreshold: 50,
      center: true,
      position: null, // deprecated, use center
      backdrop: true,
      backdropOpacity: 0.5,
      backdropColor: 'black',
      backdropContent: null,
      animationDuration: 400,
      backButtonClose: false,
      easing: Easing.elastic(0.8),
      coverScreen: false,
      keyboardTopOffset: Platform.OS === 'ios' ? 22 : 0,
    }
  },

  getInitialState() {
    return {
      position: new Animated.Value(0),
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
      keyboardOffset: 0,
    }
  },

  onBackPress() {
    this.close()
    return true
  },

  componentWillMount() {
    const position = this.props.startOpen
      ? this.getOpenPosition()
      : this.getClosePosition()
    this.setState({ position: new Animated.Value(position) })

    this.createPanResponder()
    this.handleOpenning(this.props)
    // Needed for IOS because the keyboard covers the screen
    if (Platform.OS === 'ios') {
      this.subscriptions = [
        Keyboard.addListener('keyboardWillChangeFrame', this.onKeyboardChange),
        Keyboard.addListener('keyboardDidHide', this.onKeyboardHide),
      ]
    }
  },

  componentWillUnmount() {
    if (this.subscriptions) this.subscriptions.forEach(sub => sub.remove())
  },

  componentWillReceiveProps(props) {
    if (this.props.isOpen != props.isOpen) {
      this.handleOpenning(props)
    }
  },

  handleOpenning(props) {
    if (typeof props.isOpen === 'undefined') return
    if (props.isOpen) {
      this.open()
    } else {
      this.close()
    }
  },

  /** **************** ANIMATIONS ********************* */

  /*
   * The keyboard is hidden (IOS only)
   */
  onKeyboardHide(evt) {
    this.setState({ keyboardOffset: 0 })
  },

  /*
   * The keyboard frame changed, used to detect when the keyboard open, faster than keyboardDidShow (IOS only)
   */

  onKeyboardChange(evt) {
    if (!evt) return
    if (!this.state.isOpen) return
    const keyboardFrame = evt.endCoordinates
    const keyboardHeight = this.state.containerHeight - keyboardFrame.screenY

    this.setState({ keyboardOffset: keyboardHeight }, () => {
      this.animateOpen()
    })
  },

  /*
   * Open animation for the backdrop, will fade in
   */
  animateBackdropOpen() {
    if (this.state.isAnimateBackdrop) {
      this.state.animBackdrop.stop()
    }

    const animBackdrop = Animated.timing(this.state.backdropOpacity, {
      toValue: 1,
      duration: this.props.animationDuration,
    })

    this.setState(
      {
        isAnimateBackdrop: true,
        animBackdrop,
      },
      () => {
        this.state.animBackdrop.start()
      },
    )
  },

  /*
   * Close animation for the backdrop, will fade out
   */
  animateBackdropClose() {
    if (this.state.isAnimateBackdrop) {
      this.state.animBackdrop.stop()
    }

    const animBackdrop = Animated.timing(this.state.backdropOpacity, {
      toValue: 0,
      duration: this.props.animationDuration,
    })

    this.setState(
      {
        isAnimateBackdrop: false,
        animBackdrop,
      },
      () => {
        this.state.animBackdrop.start()
      },
    )
  },

  /*
   * Stop opening animation
   */
  stopAnimateOpen() {
    if (this.state.isAnimateOpen) {
      if (this.state.animOpen) this.state.animOpen.stop()
      this.setState({ isAnimateOpen: false })
    }
  },

  /*
   * Open animation for the modal, will move up
   */
  animateOpen() {
    this.stopAnimateClose()

    // Backdrop fadeIn
    if (this.props.backdrop) {
      this.animateBackdropOpen()
    }

    this.setState(
      {
        isAnimateOpen: true,
        isOpen: true,
      },
      () => {
        requestAnimationFrame(() => {
          // Detecting modal position
          let positionDest = this.getOpenPosition()
          if (
            this.state.keyboardOffset &&
            this.state.positionDest < this.props.keyboardTopOffset
          ) {
            positionDest = this.props.keyboardTopOffset
          }
          const animOpen = Animated.timing(this.state.position, {
            toValue: positionDest,
            duration: this.props.animationDuration,
            easing: this.props.easing,
          })

          this.setState(
            {
              isAnimateOpen: false,
              animOpen,
              positionDest,
            },
            () => {
              animOpen.start(() => {
                if (!this.state.isOpen && this.props.onOpened) {
                  this.props.onOpened()
                }
              })
            },
          )
        })
      },
    )
  },

  /*
   * Stop closing animation
   */
  stopAnimateClose() {
    if (this.state.isAnimateClose) {
      if (this.state.animClose) this.state.animClose.stop()
      this.setState({ isAnimateClose: false })
    }
  },

  /*
   * Close animation for the modal, will move down
   */
  animateClose() {
    this.stopAnimateOpen()

    // Backdrop fadeout
    if (this.props.backdrop) {
      this.animateBackdropClose()
    }

    this.setState(
      {
        isAnimateClose: true,
        isOpen: false,
      },
      () => {
        const toValue = this.getClosePosition()
        const animClose = Animated.timing(this.state.position, {
          toValue,
          duration: this.props.animationDuration,
        })

        this.setState(
          {
            isAnimateClose: false,
            animClose,
          },
          () => {
            animClose.start(() => {
              Keyboard.dismiss()
              if (this.props.onClosed) this.props.onClosed()
            })
          },
        )
      },
    )
  },
  getClosePosition() {
    let position
    if (this.props.entry === 'left') {
      position = -this.state.containerWidth
    } else if (this.props.entry === 'right') {
      position = this.state.containerWidth
    } else if (this.props.entry === 'top') {
      position = -this.state.containerHeight
    } else {
      position = this.state.containerHeight
    }
    return position
  },

  /*
   * Calculate when should be placed the modal
   */
  getOpenPosition() {
    const containerHeight =
      this.state.containerHeight - this.state.keyboardOffset
    const containerWidth = this.state.containerWidth
    let position = 0

    const center = this.props.center || this.props.position === 'center'

    if (this.props.entry === 'left' || this.props.entry === 'right') {
      if (center) {
        position = containerWidth / 2 - this.state.width / 2
      } else if (this.props.entry === 'left') {
        position = -containerWidth + this.state.width
      } else {
        position = containerWidth - this.state.width
      }
    } else if (center) {
      position = containerHeight / 2 - this.state.height / 2
    } else if (this.props.entry === 'top') {
      position = -containerHeight + this.state.height
    } else {
      position = containerHeight - this.state.height
    }

    // Checking if the position >= 0
    if (position < 0) position = 0
    return position
  },

  getMoveDistance(panState) {
    let moveDistance = 0
    if (this.props.entry === 'left') {
      moveDistance = -panState.dx
    } else if (this.props.entry === 'right') {
      moveDistance = panState.dx
    } else if (this.props.entry === 'top') {
      moveDistance = -panState.dy
    } else {
      moveDistance = panState.dy
    }
    return moveDistance
  },

  /*
   * Create the pan responder to detect gesture
   * Only used if swipeToClose is enabled
   */

  createPanResponder() {
    let closingState = false
    let inSwipeArea = false

    const onPanRelease = (evt, state) => {
      if (!inSwipeArea) return
      inSwipeArea = false
      const moveDistance = this.getMoveDistance(state)
      if (moveDistance > this.props.swipeThreshold) {
        this.animateClose()
      } else {
        this.animateOpen()
      }
    }

    const animEvt = Animated.event([
      null,
      { moveDistance: this.state.position },
    ])

    const onPanMove = (evt, state) => {
      const moveDistance = this.getMoveDistance(state)
      const newClosingState = moveDistance > this.props.swipeThreshold

      if (moveDistance < 0) return
      if (newClosingState != closingState && this.props.onClosingState) {
        this.props.onClosingState(newClosingState)
      }
      closingState = newClosingState
      state.moveDistance = this.state.positionDest - Math.abs(moveDistance)

      animEvt(evt, state)
    }

    const onPanStart = (evt, state) => {
      if (
        !this.props.swipeToClose ||
        this.props.isDisabled ||
        (this.props.swipeArea &&
          evt.nativeEvent.pageY - this.state.positionDest >
            this.props.swipeArea)
      ) {
        inSwipeArea = false
        return false
      }
      inSwipeArea = true
      return true
    }

    this.setState({
      pan: PanResponder.create({
        onStartShouldSetPanResponder: onPanStart,
        onPanResponderMove: onPanMove,
        onPanResponderRelease: onPanRelease,
        onPanResponderTerminate: onPanRelease,
      }),
    })
  },

  /*
   * Event called when the modal view layout is calculated
   */
  onViewLayout(evt) {
    const height = evt.nativeEvent.layout.height
    const width = evt.nativeEvent.layout.width

    // If the dimensions are still the same we're done
    const newState = {}
    if (height !== this.state.height) newState.height = height
    if (width !== this.state.width) newState.width = width
    this.setState(newState)

    if (this.onViewLayoutCalculated) this.onViewLayoutCalculated()
  },

  /*
   * Event called when the container view layout is calculated
   */
  onContainerLayout(evt) {
    const height = evt.nativeEvent.layout.height
    const width = evt.nativeEvent.layout.width

    // If the container size is still the same we're done
    if (
      height == this.state.containerHeight &&
      width == this.state.containerWidth
    ) {
      this.setState({ isInitialized: true })
      return
    }

    if (this.state.isOpen || this.state.isAnimateOpen) {
      this.animateOpen()
    }

    if (this.props.onLayout) this.props.onLayout(evt)
    this.setState({
      isInitialized: true,
      containerHeight: height,
      containerWidth: width,
    })
  },

  /*
   * Render the backdrop element
   */
  renderBackdrop() {
    let backdrop = null

    if (this.props.backdrop) {
      backdrop = (
        <TouchableWithoutFeedback
          onPress={this.props.backdropPressToClose ? this.close : null}
        >
          <Animated.View
            style={[styles.absolute, { opacity: this.state.backdropOpacity }]}
          >
            <View
              style={[
                styles.absolute,
                {
                  backgroundColor: this.props.backdropColor,
                  opacity: this.props.backdropOpacity,
                },
              ]}
            />
            {this.props.backdropContent || []}
          </Animated.View>
        </TouchableWithoutFeedback>
      )
    }

    return backdrop
  },

  renderContent() {
    const size = {
      height: this.state.containerHeight,
      width: this.state.containerWidth,
    }
    const offsetX = (this.state.containerWidth - this.state.width) / 2
    const offsetY = (this.state.containerHeight - this.state.height) / 2
    let transform
    if (this.props.entry === 'left') {
      transform = [{ translateX: this.state.position }, { translateY: offsetY }]
    } else if (this.props.entry === 'right') {
      transform = [{ translateX: this.state.position }, { translateY: offsetY }]
    } else if (this.props.entry === 'top') {
      transform = [{ translateY: this.state.position }, { translateX: offsetX }]
    } else {
      transform = [{ translateY: this.state.position }, { translateX: offsetX }]
    }

    return (
      <Animated.View
        onLayout={this.onViewLayout}
        style={[styles.wrapper, size, this.props.style, { transform }]}
        {...this.state.pan.panHandlers}
      >
        {this.props.children}
      </Animated.View>
    )
  },

  /*
   * Render the component
   */
  render() {
    const visible =
      this.state.isOpen || this.state.isAnimateOpen || this.state.isAnimateClose

    if (!visible) return <View />

    const content = (
      <View
        style={[styles.transparent, styles.absolute]}
        pointerEvents={'box-none'}
      >
        <View
          style={{ flex: 1 }}
          pointerEvents={'box-none'}
          onLayout={this.onContainerLayout}
        >
          {visible && this.renderBackdrop()}
          {visible && this.renderContent()}
        </View>
      </View>
    )

    if (!this.props.coverScreen) return content

    return (
      <Modal
        onRequestClose={() => this.close()}
        supportedOrientations={['landscape', 'portrait']}
        transparent
        visible={visible}
      >
        {content}
      </Modal>
    )
  },

  /** **************** PUBLIC METHODS ********************* */

  open() {
    if (this.props.isDisabled) return
    if (
      !this.state.isAnimateOpen &&
      (!this.state.isOpen || this.state.isAnimateClose)
    ) {
      this.onViewLayoutCalculated = () => {
        this.setState({})
        this.animateOpen()
        if (this.props.backButtonClose && Platform.OS === 'android') {
          BackButton.addEventListener('hardwareBackPress', this.onBackPress)
        }
        delete this.onViewLayoutCalculated
      }
      this.setState({ isAnimateOpen: true })
    }
  },

  close() {
    if (this.props.isDisabled) return
    if (
      !this.state.isAnimateClose &&
      (this.state.isOpen || this.state.isAnimateOpen)
    ) {
      this.animateClose()
      if (this.props.backButtonClose && Platform.OS === 'android') {
        BackButton.removeEventListener('hardwareBackPress', this.onBackPress)
      }
    }
  },
})

module.exports = ModalBox
