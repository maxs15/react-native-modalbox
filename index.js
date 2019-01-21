import React from 'react';
import PropTypes from 'prop-types';
import {
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
} from 'react-native';

const BackButton = BackHandler || BackAndroid;

const screen = Dimensions.get('window');

const styles = StyleSheet.create({

    wrapper: {
        backgroundColor: 'white'
    },

    transparent: {
        zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0)'
    },

    absolute: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    }

});

export default class ModalBoxBase extends React.Component {

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
        onClosingState: PropTypes.func,
    };

    static defaultProps = {
        startOpen: false,
        backdropPressToClose: true,
        swipeToClose: true,
        swipeThreshold: 50,
        position: 'center',
        backdrop: true,
        backdropOpacity: 0.5,
        backdropColor: 'black',
        backdropContent: null,
        animationDuration: 400,
        backButtonClose: false,
        easing: Easing.elastic(0.8),
        coverScreen: false,
        keyboardTopOffset: Platform.OS === 'ios' ? 22 : 0
    };

    constructor(props) {
        super(props);
        const {entry, startOpen} = props;
        const position = entry === 'top' ? -screen.height : screen.height;
        this.state = {
            position: startOpen ? new Animated.Value(0) : new Animated.Value(position),
            backdropOpacity: new Animated.Value(0),
            isOpen: startOpen,
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
    }

    componentWillMount() {
        this.createPanResponder();
        this.handleOpenning(this.props);
        // Needed for IOS because the keyboard covers the screen
        if (Platform.OS === 'ios') {
            this.subscriptions = [
                Keyboard.addListener('keyboardWillChangeFrame', this.onKeyboardChange),
                Keyboard.addListener('keyboardDidHide', this.onKeyboardHide)
            ];
        }
    }

    componentWillUnmount() {
        if (this.subscriptions) this.subscriptions.forEach((sub) => sub.remove());
    }

    componentWillReceiveProps(nextProps) {
        const {isOpen} = this.props;
        if (isOpen !== nextProps.isOpen) {
            this.handleOpenning(nextProps);
        }
    }

    onBackPress = () => {
        this.close();
        return true;
    };

    handleOpenning = (props) => {
        if (typeof props.isOpen === 'undefined') return;
        if (props.isOpen)
            this.open();
        else
            this.close();
    };


    /**
     * **************** ANIMATIONS *********************
     */

    /*
     * The keyboard is hidden (IOS only)
     */
    onKeyboardHide = (evt) => {
        this.setState({keyboardOffset: 0});
    };


    /*
     * The keyboard frame changed, used to detect when the keyboard open, faster than keyboardDidShow (IOS only)
     */
    onKeyboardChange = (evt) => {
        if (!evt) return;
        const {isOpen, containerHeight} = this.state;
        if (!isOpen) return;
        const keyboardFrame = evt.endCoordinates;
        const keyboardHeight = containerHeight - keyboardFrame.screenY;
        this.setState({keyboardOffset: keyboardHeight}, () => {
            this.animateOpen();
        });
    };


    /*
     * Open animation for the backdrop, will fade in
     */
    animateBackdropOpen = () => {
        const {animationDuration, easing} = this.props;
        const {isAnimateBackdrop, animBackdrop, backdropOpacity} = this.state;
        if (isAnimateBackdrop && animBackdrop) {
            animBackdrop.stop();
        }
        this.setState({isAnimateBackdrop: true});

        const _animBackdrop = Animated.timing(
            backdropOpacity,
            {
                toValue: 1,
                duration: animationDuration,
                easing,
                useNativeDriver: true,
            }
        ).start(() => {
            this.setState({
                isAnimateBackdrop: false,
                animBackdrop: _animBackdrop,
            });
        });
    };


    /*
     * Close animation for the backdrop, will fade out
     */
    animateBackdropClose = () => {
        const {animationDuration, easing} = this.props;
        const {isAnimateBackdrop, animBackdrop, backdropOpacity} = this.state;
        if (isAnimateBackdrop && animBackdrop) {
            animBackdrop.stop();
        }
        this.setState({isAnimateBackdrop: true});

        const _animBackdrop = Animated.timing(
            backdropOpacity,
            {
                toValue: 0,
                duration: animationDuration,
                easing,
                useNativeDriver: true,
            }
        ).start(() => {
            this.setState({
                isAnimateBackdrop: false,
                animBackdrop: _animBackdrop,
            });
        });
    };


    /*
     * Stop opening animation
     */
    stopAnimateOpen = () => {
        const {isAnimateOpen, animOpen} = this.state;
        if (isAnimateOpen) {
            if (animOpen) animOpen.stop();
            this.setState({isAnimateOpen: false});
        }
    };


    /*
     * Open animation for the modal, will move up
     */
    animateOpen = () => {
        const {backdrop, animationDuration, easing, onOpened} = this.props;
        const {containerHeight, keyboardOffset, containerWidth, keyboardTopOffset, position} = this.state;
        this.stopAnimateClose();

        // Backdrop fadeIn
        if (backdrop)
            this.animateBackdropOpen();

        this.setState({
            isAnimateOpen: true,
            isOpen: true,
        }, () => {
            requestAnimationFrame(() => {
                // Detecting modal position
                let positionDest = this.calculateModalPosition(containerHeight - keyboardOffset, containerWidth);
                if (keyboardOffset && (positionDest < keyboardTopOffset)) {
                    positionDest = keyboardTopOffset;
                }
                const animOpen = Animated.timing(
                    position,
                    {
                        toValue: positionDest,
                        duration: animationDuration,
                        easing,
                        useNativeDriver: true,
                    }
                ).start(() => {
                    this.setState({
                        isAnimateOpen: false,
                        animOpen,
                        positionDest
                    });
                    if (onOpened) onOpened();
                });
            });
        });
    };


    /*
     * Stop closing animation
     */
    stopAnimateClose = () => {
        const {isAnimateClose, animClose} = this.state;
        if (isAnimateClose) {
            if (animClose) animClose.stop();
            this.setState({isAnimateClose: false});
        }
    };


    /*
     * Close animation for the modal, will move down
     */
    animateClose = () => {
        const {backdrop, entry, animationDuration, easing, onClosed} = this.props;
        const {position, containerHeight} = this.state;
        this.stopAnimateOpen();

        // Backdrop fadeout
        if (backdrop)
            this.animateBackdropClose();

        this.setState({
            isAnimateClose: true,
            isOpen: false,
        }, () => {
            const animClose = Animated.timing(
                position,
                {
                    toValue: entry === 'top' ? -containerHeight : containerHeight,
                    duration: animationDuration,
                    easing,
                    useNativeDriver: true,
                }
            ).start(() => {
                // Keyboard.dismiss();   // make this optional. Easily user defined in .onClosed() callback
                this.setState({
                    isAnimateClose: false,
                    animClose
                });
                if (onClosed) onClosed();
            });
        });
    };


    /*
     * Calculate when should be placed the modal
     */
    calculateModalPosition = (containerHeight, containerWidth) => {
        const {position} = this.props;
        const {height} = this.state;
        let positionCalculated = 0;
        if (position === 'bottom') {
            positionCalculated = containerHeight - height;
        } else if (position === 'center') {
            positionCalculated = containerHeight / 2 - height / 2;
        }
        // Checking if the position >= 0
        if (positionCalculated < 0) positionCalculated = 0;
        return positionCalculated;
    };


    /*
     * Create the pan responder to detect gesture
     * Only used if swipeToClose is enabled
     */
    createPanResponder = () => {
        // const {entry, swipeThreshold, onClosingState, swipeToClose, isDisabled, swipeArea} = this.props;
        // const {isOpen, position, positionDest} = this.state;
        const {position} = this.state;

        let closingState = false;
        let inSwipeArea = false;

        const onPanRelease = function (evt, state) {
            const {entry, swipeThreshold} = this.props;
            const {isOpen} = this.state;
            if (!inSwipeArea) return;
            inSwipeArea = false;
            if (entry === 'top' ? -state.dy > swipeThreshold : state.dy > swipeThreshold) {
                this.animateClose();
            } else if (!isOpen) {
                this.animateOpen();
            }
        }.bind(this);

        const animEvt = Animated.event([null, {customY: position}]);

        const onPanMove = function (evt, state) {
            const {entry, swipeThreshold, onClosingState} = this.props;
            const {positionDest} = this.state;
            const newState = state;
            const newClosingState = entry === 'top' ? -state.dy > swipeThreshold : state.dy > swipeThreshold;
            if (entry === 'top' ? state.dy > 0 : state.dy < 0) return;
            if (newClosingState !== closingState && onClosingState) onClosingState(newClosingState);
            closingState = newClosingState;
            newState.customY = state.dy + positionDest;
            animEvt(evt, newState);
        }.bind(this);

        const onPanStart = function (evt, state) {
            const {swipeToClose, isDisabled, swipeArea} = this.props;
            const {positionDest} = this.state;
            if (!swipeToClose || isDisabled || (swipeArea && (evt.nativeEvent.pageY - positionDest) > swipeArea)) {
                inSwipeArea = false;
                return false;
            }
            inSwipeArea = true;
            return true;
        }.bind(this);

        this.setState({
            pan: PanResponder.create({
                onStartShouldSetPanResponder: onPanStart,
                onPanResponderMove: onPanMove,
                onPanResponderRelease: onPanRelease,
                onPanResponderTerminate: onPanRelease,
            }),
        });
    };


    /*
     * Event called when the modal view layout is calculated
     */
    onViewLayout = (evt) => {
        const {height, width} = this.state;
        const newHeight = evt.nativeEvent.layout.height;
        const newWidth = evt.nativeEvent.layout.width;
        // If the dimensions are still the same we're done
        const newState = {};
        if (newHeight !== height) newState.height = newHeight;
        if (newWidth !== width) newState.width = newWidth;
        this.setState(newState);
        if (this.onViewLayoutCalculated) this.onViewLayoutCalculated();
    };


    /*
     * Event called when the container view layout is calculated
     */
    onContainerLayout = (evt) => {
        const {onLayout} = this.props;
        const {containerHeight, containerWidth, isOpen, isAnimateOpen} = this.state;
        const newHeight = evt.nativeEvent.layout.height;
        const newWidth = evt.nativeEvent.layout.width;
        // If the container size is still the same we're done
        if (newHeight === containerHeight && newWidth === containerWidth) {
            this.setState({isInitialized: true});
            return;
        }
        if (isOpen || isAnimateOpen) {
            this.animateOpen();
        }
        if (onLayout) onLayout(evt);
        this.setState({
            isInitialized: true,
            containerHeight: newHeight,
            containerWidth: newWidth
        });
    };


    /*
     * Render the backdrop element
     */
    renderBackdrop = () => {
        const {backdrop, backdropPressToClose, backdropColor, backdropOpacity, backdropContent} = this.props;
        let newBackdrop = null;
        if (backdrop) {
            newBackdrop = (
                <TouchableWithoutFeedback onPress={backdropPressToClose ? this.close : null}>
                    <Animated.View importantForAccessibility='no' style={[styles.absolute, {opacity: backdropOpacity}]}>
                        <View style={[styles.absolute, {backgroundColor: backdropColor, opacity: backdropOpacity}]}/>
                        {backdropContent || []}
                    </Animated.View>
                </TouchableWithoutFeedback>
            );
        }
        return newBackdrop;
    };


    renderContent = () => {
        const {style, backdropPressToClose, children} = this.props;
        const {containerHeight, containerWidth, width, position, pan} = this.state;
        const size = {height: containerHeight, width: containerWidth};
        const offsetX = (containerWidth - width) / 2;
        return (
            <Animated.View
                onLayout={this.onViewLayout}
                style={[styles.wrapper, size, style, {transform: [{translateY: position}, {translateX: offsetX}]}]}
                {...pan.panHandlers}>
                {backdropPressToClose && <TouchableWithoutFeedback onPress={this.close}><View style={[styles.absolute]}/></TouchableWithoutFeedback>}
                {children}
            </Animated.View>
        );
    };


    /*
     * Render the component
     */
    render() {
        const {coverScreen, backButtonClose} = this.props;
        const {isOpen, isAnimateOpen, isAnimateClose} = this.state;
        const visible = isOpen || isAnimateOpen || isAnimateClose;

        if (!visible) return <View />;

        const content = (
            <View
                importantForAccessibility='yes'
                accessibilityViewIsModal
                style={[styles.transparent, styles.absolute]}
                pointerEvents='box-none'>
                <View style={{flex: 1}} pointerEvents='box-none' onLayout={this.onContainerLayout}>
                    {visible && this.renderBackdrop()}
                    {visible && this.renderContent()}
                </View>
            </View>
        );

        if (!coverScreen) return content;

        return (
            <Modal
                onRequestClose={() => {
                    if (backButtonClose) {
                        this.close();
                    }
                }}
                supportedOrientations={['landscape', 'portrait', 'portrait-upside-down']}
                transparent
                visible={visible}
                hardwareAccelerated
            >
                {content}
            </Modal>
        );
    }


    /**
     ***************** PUBLIC METHODS *********************
     */
    open = () => {
        const {isDisabled, backButtonClose} = this.props;
        const {isAnimateOpen, isOpen, isAnimateClose} = this.state;
        if (isDisabled) return;
        if (!isAnimateOpen && (!isOpen || isAnimateClose)) {
            this.onViewLayoutCalculated = () => {
                this.setState({});
                this.animateOpen();
                if (backButtonClose && Platform.OS === 'android')
                    BackButton.addEventListener('hardwareBackPress', this.onBackPress);
                delete this.onViewLayoutCalculated;
            };
            this.setState({isAnimateOpen: true});
        }
    };

    close = () => {
        const {isDisabled, backButtonClose} = this.props;
        const {isAnimateClose, isOpen, isAnimateOpen} = this.state;
        if (isDisabled) return;
        if (!isAnimateClose && (isOpen || isAnimateOpen)) {
            this.animateClose();
            if (backButtonClose && Platform.OS === 'android')
                BackButton.removeEventListener('hardwareBackPress', this.onBackPress);
        }
    };

}
