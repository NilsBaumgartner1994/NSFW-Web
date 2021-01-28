import React, {Component, memo} from 'react';

import {Handle, Position} from "react-flow-renderer";

const zoom = 1;

export class ReactFlowNetzplanNode extends Component {

    static getNodeTypeName(){
        return "ReactFlowNetzplanNode";
    }

    static getMemoRenderer(){
        const component = React.memo(({ data }) => {
            return <ReactFlowNetzplanNode data={data} />
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
            style: ReactFlowNetzplanNode.getElementStyle(),
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            type: ReactFlowNetzplanNode.getNodeTypeName(),
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
        console.log("ReactFlowNetzplanNode constructor");
        console.log(props);
    }

    render() {
        let fontStyle = {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "black",
            fontSize: 8*zoom+"px",
            fontFamily: "Helvetica",
        };

        let borderStyle = {
            border: "1px solid black",
        }

        let centerStyle = Object.assign(fontStyle,borderStyle);

        let topContent = <Handle type="target" position={Position.Top}/>;
        let bottomContent = <Handle type="source" position={Position.Bottom} />;

        if(!!this.props.data.note){
            topContent = <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "black",
                fontSize: 8*zoom+"px",
                fontFamily: "Helvetica",
            }}>{"\n"+this.props.data.note}</div>;
            bottomContent = null;
        }



        return (
            <>
                {topContent}
                    <div className="p-grid p-nogutter" style={{backgroundColor: "white", width: "100%", height: "100%"}}>
                        <div className="p-col-12 p-nogutter" style={centerStyle} >
                            {this.props.data.label}
                        </div>
                        <div className="p-col-12 p-nogutter" style={centerStyle} >
                            {this.props.data.duration}{" "}{"("+this.props.data.buffer+")"}
                        </div>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {this.props.data.earliestStart}
                        </div>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {this.props.data.earliestEnd}
                        </div>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {this.props.data.latestStart}
                        </div>
                        <div className="p-col-6 p-nogutter" style={centerStyle} >
                            {this.props.data.latestEnd}
                        </div>
                </div>
                {bottomContent}
            </>
        );
    }
}
