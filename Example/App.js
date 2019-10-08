import React from 'react';
import Modal from 'react-native-modalbox';
import Slider from 'react-native-slider';

import {
  Text,
  Button,
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  TextInput
} from 'react-native';

var screen = Dimensions.get('window');

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      isOpen: false,
      isDisabled: false,
      swipeToClose: true,
      sliderValue: 0.3
    };
  }

  onClose() {
    console.log('Modal just closed');
  }

  onOpen() {
    console.log('Modal just opened');
  }

  onClosingState(state) {
    console.log('the open/close of the swipeToClose just changed');
  }

  renderList() {
    var list = [];

    for (var i=0;i<50;i++) {
      list.push(<Text style={styles.text} key={i}>Elem {i}</Text>);
    }

    return list;
  }

  render() {
    var BContent = (
      <View style={[styles.btn, styles.btnModal]}>
        <Button title="X" color="white" onPress={() => this.setState({isOpen: false})}/>
      </View>
    );

    return (
      <View style={styles.wrapper}>
        <Button title="Basic modal" onPress={() => this.refs.modal1.open()} style={styles.btn}/>
        <Button title="Position top" onPress={() => this.refs.modal2.open()} style={styles.btn}/>
        <Button title="Position centered + backdrop + disable" onPress={() => this.refs.modal3.open()} style={styles.btn}/>
        <Button title="Position bottom + backdrop + slider" onPress={() => this.refs.modal4.open()} style={styles.btn}/>
        <Button title="Backdrop + backdropContent" onPress={() => this.setState({isOpen: true})} style={styles.btn}/>
        <Button title="Position bottom + ScrollView" onPress={() => this.refs.modal6.open()} style={styles.btn}/>
        <Button title="Modal with keyboard support" onPress={() => this.refs.modal7.open()} style={styles.btn}/>
        <Button title="Entry from top" onPress={() => this.refs.modal8.open()} style={styles.btn}/>

        <Modal
          style={[styles.modal, styles.modal1]}
          ref={"modal1"}
          swipeToClose={this.state.swipeToClose}
          onClosed={this.onClose}
          onOpened={this.onOpen}
          onClosingState={this.onClosingState}>
            <Text style={styles.text}>Basic modal</Text>
            <Button title={`Disable swipeToClose(${this.state.swipeToClose ? "true" : "false"})`} onPress={() => this.setState({swipeToClose: !this.state.swipeToClose})} style={styles.btn}/>
        </Modal>

        <Modal style={[styles.modal, styles.modal2]} backdrop={false}  position={"top"} ref={"modal2"}>
          <Text style={[styles.text, {color: "white"}]}>Modal on top</Text>
        </Modal>

        <Modal style={[styles.modal, styles.modal3]} position={"center"} ref={"modal3"} isDisabled={this.state.isDisabled}>
          <Text style={styles.text}>Modal centered</Text>
          <Button title={`Disable (${this.state.isDisabled ? "true" : "false"})`} onPress={() => this.setState({isDisabled: !this.state.isDisabled})} style={styles.btn}/>
        </Modal>

        <Modal style={[styles.modal, styles.modal4]} position={"bottom"} ref={"modal4"}>
          <Text style={styles.text}>Modal on bottom with backdrop</Text>
          <Slider style={{width: 200}} value={this.state.sliderValue} onValueChange={(value) => this.setState({sliderValue: value})} />
        </Modal>

        <Modal isOpen={this.state.isOpen} onClosed={() => this.setState({isOpen: false})} style={[styles.modal, styles.modal4]} position={"center"} backdropPressToClose={false} backdropContent={BContent}>
          <Text style={styles.text}>Modal with backdrop content</Text>
        </Modal>

        <Modal style={[styles.modal, styles.modal4]} position={"bottom"} ref={"modal6"} swipeArea={20}>
          <ScrollView>
            <View style={{width: screen.width, paddingLeft: 10}}>
              {this.renderList()}
            </View>
          </ScrollView>
        </Modal>

        <Modal ref={"modal7"} style={[styles.modal, styles.modal4]} position={"center"}>
          <View>
            <TextInput style={{height: 50, width: 200, backgroundColor: '#DDDDDD'}}/>
          </View>
        </Modal>

        <Modal ref={"modal8"} style={[styles.modal, styles.modal2]} position={"top"} entry={"top"}>
          <Text style={[styles.text, {color: "white"}]}>Modal entry from top</Text>
        </Modal>
      </View>
    );
  }

}

const styles = StyleSheet.create({

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