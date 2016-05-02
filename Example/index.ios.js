'use strict';

var React   = require('react-native');
var Button  = require('react-native-button');
var Modal   = require('react-native-modalbox');
var Slider  = require('react-native-slider');
var window  = require('Dimensions').get('window');

var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView
} = React;

var styles = StyleSheet.create({

  wrapper: {
    paddingTop: 50,
    flex: 1
  },

  modal: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  modal2: {
    height: 230,
    backgroundColor: "#3B5998"
  },

  modal3: {
    height: 300,
    width: 300
  },

  modal4: {
    height: 300
  },

  btn: {
    margin: 10,
    backgroundColor: "#3B5998",
    color: "white",
    padding: 10
  },

  btnModal: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    backgroundColor: "transparent"
  },

  text: {
    color: "black",
    fontSize: 22
  }

});

var Example = React.createClass({

  getInitialState: function() {
    return {
      isOpen: false,
      isDisabled: false,
      swipeToClose: true,
      sliderValue: 0.3
    };
  },

  openModal1: function(id) {
    this.refs.modal1.open();
  },

  openModal2: function(id) {
    this.refs.modal2.open();
  },

  openModal3: function(id) {
    this.refs.modal3.open();
  },

  openModal4: function(id) {
    this.refs.modal4.open();
  },

  openModal5: function(id) {
    this.setState({isOpen: true});
  },

  closeModal5: function(id) {
    this.setState({isOpen: false});
  },

  openModal6: function(id) {
    this.refs.modal6.open();
  },

  toggleDisable: function() {
    this.setState({isDisabled: !this.state.isDisabled});
  },

  toggleSwipeToClose: function() {
    this.setState({swipeToClose: !this.state.swipeToClose});
  },

  onClose: function() {
    console.log('Modal just closed');
  },

  onOpen: function() {
    console.log('Modal just openned');
  },

  onClosingState: function(state) {
    console.log('the open/close of the swipeToClose just changed');
  },

  renderList() {
    var list = [];

    for (var i=0;i<50;i++) {
      list.push(<Text style={styles.text} key={i}>Elem {i}</Text>);
    }

    return list;
  },

  render: function() {

    var BContent = <Button onPress={this.closeModal5} style={[styles.btn, styles.btnModal]}>X</Button>;

    return (
      <View style={styles.wrapper}>
        <Button onPress={this.openModal1} style={styles.btn}>Basic modal</Button>
        <Button onPress={this.openModal2} style={styles.btn}>Position top</Button>
        <Button onPress={this.openModal3} style={styles.btn}>Position centered + backdrop + disable</Button>
        <Button onPress={this.openModal4} style={styles.btn}>Position bottom + backdrop + slider</Button>
        <Button onPress={this.openModal5} style={styles.btn}>Backdrop + backdropContent</Button>
        <Button onPress={this.openModal6} style={styles.btn}>Position bottom + ScrollView</Button>

        <Modal style={[styles.modal, styles.modal1]} ref={"modal1"} swipeToClose={this.state.swipeToClose} onClosed={this.onClose} onOpened={this.onOpen} onClosingState={this.onClosingState}>
          <Text style={styles.text}>Basic modal</Text>
          <Button onPress={this.toggleSwipeToClose} style={styles.btn}>Disable swipeToClose({this.state.swipeToClose ? "true" : "false"})</Button>
        </Modal>

        <Modal style={[styles.modal, styles.modal2]} backdrop={false}  position={"top"} ref={"modal2"}>
          <Text style={[styles.text, {color: "white"}]}>Modal on top</Text>
        </Modal>

        <Modal style={[styles.modal, styles.modal3]} position={"center"} ref={"modal3"} isDisabled={this.state.isDisabled}>
          <Text style={styles.text}>Modal centered</Text>
          <Button onPress={this.toggleDisable} style={styles.btn}>Disable ({this.state.isDisabled ? "true" : "false"})</Button>
        </Modal>

        <Modal style={[styles.modal, styles.modal4]} position={"bottom"} ref={"modal4"}>
          <Text style={styles.text}>Modal on bottom with backdrop</Text>
          <Slider style={{width: 200}} value={this.state.sliderValue} onValueChange={(value) => this.setState({sliderValue: value})} />
        </Modal>

        <Modal isOpen={this.state.isOpen} onClosed={this.closeModal5} style={[styles.modal, styles.modal4]} position={"center"} backdropContent={BContent}>
          <Text style={styles.text}>Modal with backdrop content</Text>
        </Modal>

        <Modal style={[styles.modal, styles.modal4]} position={"bottom"} ref={"modal6"} swipeArea={20}>
          <ScrollView>
            <View style={{width: window.width, paddingLeft: 10}}>
              {this.renderList()}
            </View>
          </ScrollView>
        </Modal>
      </View>
    );
  }
});

AppRegistry.registerComponent('Example', () => Example);
