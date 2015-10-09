'use strict';

var React   = require('react-native');
var Button  = require('react-native-button');
var Modal   = require('react-native-modalbox');

var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
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

  modal1: {
    flex: 1
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
      isOpen: false
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

  onClose: function() {
    console.log('Modal just closed');
  },

  onOpen: function() {
    console.log('Modal just openned');
  },

  onClosingState: function(state) {
    console.log('the open/close of the swipeToClose just changed');
  },

  render: function() {

    var BContent = <Button onPress={this.closeModal5} style={[styles.btn, styles.btnModal]}>X</Button>;

    return (
      <View style={styles.wrapper}>
        <Button onPress={this.openModal1} style={styles.btn}>Basic modal</Button>
        <Button onPress={this.openModal2} style={styles.btn}>Position top</Button>
        <Button onPress={this.openModal3} style={styles.btn}>Position centered + backdrop</Button>
        <Button onPress={this.openModal4} style={styles.btn}>Position bottom + backdrop</Button>
        <Button onPress={this.openModal5} style={styles.btn}>Backdrop + backdropContent</Button>

        <Modal style={[styles.modal, styles.modal1]} ref={"modal1"} onClosed={this.onClose} onOpened={this.onOpen} onClosingState={this.onClosingState}>
          <Text style={styles.text}>Basic modal</Text>
        </Modal>

        <Modal style={[styles.modal, styles.modal2]} backdrop={false}  position={"top"} ref={"modal2"}>
          <Text style={[styles.text, {color: "white"}]}>Modal on top</Text>
        </Modal>

        <Modal style={[styles.modal, styles.modal3]} position={"center"} ref={"modal3"}>
          <Text style={styles.text}>Modal centered</Text>
        </Modal>

        <Modal style={[styles.modal, styles.modal4]} position={"bottom"} ref={"modal4"}>
          <Text style={styles.text}>Modal on bottom with backdrop</Text>
        </Modal>

        <Modal isOpen={this.state.isOpen} onClosed={this.closeModal5} style={[styles.modal, styles.modal4]} position={"center"} backdropContent={BContent}>
          <Text style={styles.text}>Modal with backdrop content</Text>
        </Modal>
      </View>
    );
  }
});

AppRegistry.registerComponent('Example', () => Example);
