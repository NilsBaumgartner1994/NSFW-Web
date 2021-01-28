import React, {Component} from "react";
import {Dialog} from "../components/dialog/Dialog";
import {Button} from "../components/button/Button";

export class DialogHelper extends Component {

    constructor(props) {
        super(props);
        this.state = {
            header : null,
            visible: null,
            style: null,
            footer: null,
            content: null,
        }
    }

    setDialogState(header=this.state.header, visible=this.state.visible, style=this.state.style, footer=this.state.footer, content=this.state.content){
        this.setState({
            header : header,
            visible: visible,
            style: style,
            footer: footer,
            content: content,
        })
    }

    setDialogStateSimple(header,visible,callback,content){
        this.setDialogState(
            header,
            visible,
            null,
            this.getDefaultFooter(callback),
            content
        )
    }

    getDefaultFooter(callback=() => {}){
        if(!callback){
            callback = () => {};
        }

        const footer = (
            <div>
                <Button label="Yes" icon="pi pi-check" className="p-button p-button-raised" onClick={() => {this.hide(); callback(true); }} />
                <Button label="No" icon="pi pi-times" className="p-button-danger p-button-raised" onClick={() => {this.hide(); callback(false)}} />
            </div>
        );
        return footer;
    }

    setDefaultFooter(successCallback,abortCallback){
        const footer = this.getDefaultFooter(successCallback,abortCallback);
        this.setState({
            footer: footer
        });
    }

    setVisible(visible){
        this.setState({
            visible: visible
        })
    }

    hide(){
        this.setVisible(false);
    }

    show(){
        this.setVisible(true);
    }

    render() {
        return(
            <Dialog header={this.state.header || ""} visible={this.state.visible || false} style={this.state.style || {}} footer={this.state.footer || null} modal={true} onHide={this.hide.bind(this)}>
                {this.state.content || null}
            </Dialog>
        );
    }

}
