import React, {Component, memo} from 'react';

import {Handle, Position} from "react-flow-renderer";
import {GraphHelper} from "../../customHelper/GraphHelper";
import {InputNumber} from "../../components/inputnumber/InputNumber";
import {InputText} from "../../components/inputtext/InputText";
import {Netzplan} from "./Netzplan";

const zoom = 1;

const fontStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "black",
    fontSize: 8*zoom+"px",
    fontFamily: "Helvetica",
};

const borderStyle = {
    border: "1px solid black",
}

const centerStyle = Object.assign(fontStyle,borderStyle);

export class NetzplanNodeEditable extends Component {

    static inputStyle = {textAlign: "center", height: (GraphHelper.DEFAULT_NODE_HEIGHT/4)+"px", width: (GraphHelper.DEFAULT_NODE_WIDTH/2)+"px"}

    static getNodeTypeName(){
        return "ReactFlowNetzplanNode";
    }

    static getMemoRenderer(){
        const component = React.memo(({ data }) => {
            return <NetzplanNodeEditable data={data} />
        });
        return component;
    }

    static getLegendElement(){
        const position = { x: 0, y: 0 };
        return {
            id: "$testElement$",
            data: {
                label: "Name",
                duration: "Dauer",
                buffer: "Puffer",
                earliestStart: "Frühester Start",
                earliestEnd: "Frühestes Ende",
                latestStart: "Spätester Start",
                latestEnd: "Spätestes Ende",
                note: "Legende"
            },
            style: NetzplanNodeEditable.getElementStyle(),
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            type: NetzplanNodeEditable.getNodeTypeName(),
            position,
        };
    }

    static getElementStyle(){
        let ratio = 188.0/105.0;
        let height = 60*zoom;
        let width = height*ratio;

        return(
            {
                background: "white",
                width: width,
                height: height,
                color: "#fff",
                boxShadow: "5px 5px 5px 0px rgba(0,0,0,.10)"
            }
        )
    }

    constructor(props) {
        super(props);
        let duration = undefined;
        let label = undefined;
        let data = this.props.data;
        console.log("Constructor");
        if(!!data){
            console.log("Duration given");
            if(!!data.label){
                label = data.label;
            } else {
                label = data.id;
            }
            duration = data.duration;
        }

        this.state = {
            label: label,
            duration: duration,
        }

        this.labelInputStyle = {textAlign: "center", height: (Netzplan.NODE_HEIGHT/4)+"px", width: (GraphHelper.DEFAULT_NODE_WIDTH)+"px"}
        this.outerHolderStyle = {
            backgroundColor: "white",
            width: GraphHelper.DEFAULT_NODE_WIDTH,
            height: Netzplan.NODE_HEIGHT
        };
    }

    renderForSidebar(){
        return(
            <>
                <div className="p-grid p-nogutter" style={this.outerHolderStyle}>
                    <div className="p-col-12 p-nogutter" style={centerStyle} >
                        {"Label"}
                    </div>
                    <div className="p-col-12 p-nogutter" style={centerStyle} >
                        {"Dauer"}{" "}{"("+"Puffer"+")"}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {"Früh. Start"}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {"Früh. Ende"}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {"Spät. Start"}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {"Spät. Ende"}
                    </div>
                </div>
            </>
        )
    }

    onChangeDuration(event){
        this.setState({
            duration: event.value
        });
    }

    onBlurDuration(event){
        let netzplanInstance = this.props.data.instance;
        let id = this.props.data.id;
        netzplanInstance.setNodeDuration(id, this.state.duration);
    }

    renderDurationInput(){
        return <InputNumber onBlur={this.onBlurDuration.bind(this)} inputStyle={NetzplanNodeEditable.inputStyle} value={this.state.duration} onChange={this.onChangeDuration.bind(this)}/>;
    }


    onChangeLabel(event){
        this.setState({
            label: event.target.value
        });
    }

    onBlurLabel(event){
        let netzplanInstance = this.props.data.instance;
        let id = this.props.data.id;
        netzplanInstance.setNodeLabel(id, this.state.label);
    }

    renderLabelInput(){
        return <InputText onBlur={this.onBlurLabel.bind(this)}  style={this.labelInputStyle} value={this.state.label} onChange={this.onChangeLabel.bind(this)}/>;
    }

    render() {
        let topContent = <Handle type="target" position={Position.Top}/>;
        let bottomContent = <Handle type="source" position={Position.Bottom} />;

        let data = this.props.data;
        if(!data){ //Sidebar
            return this.renderForSidebar()
        }

        return (
            <>
                {topContent}
                <div className="p-grid p-nogutter" style={this.outerHolderStyle}>
                    <div className="p-col-12 p-nogutter" style={centerStyle} >
                        {this.renderLabelInput()}
                    </div>
                    <div className="p-col-12 p-nogutter" style={centerStyle} >
                        {this.renderDurationInput()}{" "}{"("+data.buffer+")"}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {""+data.earliestStart}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {""+data.earliestEnd}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {""+data.latestStart}
                    </div>
                    <div className="p-col-6 p-nogutter" style={centerStyle} >
                        {""+data.latestEnd}
                    </div>
                </div>
                {bottomContent}
            </>
        );
    }
}
