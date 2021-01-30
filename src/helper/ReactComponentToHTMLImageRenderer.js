import React, {Component} from "react";
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom';

const fileType = {
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    PDF: 'application/pdf'
};

export default class ReactComponentToHTMLImageRenderer extends Component {

    static getHiddenContainer(){
        let hidden = true;
        let style = {};
        if(hidden){
            style={position: "absolute",
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
                height: "1px",
                width: "1px",
                margin: "-1px",
                padding: 0,
                border: 0 };
        }

        return( //render it, but hide it, so it isnt displayed
            <div id="divCheckbox" style={style}>
                <div id={"renderContainer"} >
                </div>
            </div>
        )
    }

    static async reactNodeToDataURL(componentRef){
        if(!componentRef.current) {
            return "FEHLER !";
        }

        let type = fileType.PNG;

        const element = ReactDOM.findDOMNode(componentRef.current);
        let html2CanvasOptions = {
            scale: 1
        };
        let canvas = await html2canvas(element, {
            scrollY: -window.scrollY,
            useCORS: true,
            ...html2CanvasOptions
        });
        let dataURL = canvas.toDataURL(type, 1.0);
        return dataURL;
    }

    static DEFAULT_WIDTH = 1000;
    static DEFAULT_HEIGHT = 1000;

    static sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    static async renderElement(element, promiseFinishedRendering){
        let promiseClear = new Promise(function(resolve, reject) {
            // executor (the producing code, "singer")
            ReactDOM.render(null, document.getElementById('renderContainer'), async () => {
                console.log("Callback from ReactDom renderClear");
                resolve(true);
            });
        });
        let promise = new Promise(function(resolve, reject) {
            // executor (the producing code, "singer")
            ReactDOM.render(element, document.getElementById('renderContainer'), async () => {
                console.log("Callback from ReactDom render");
                if(!!promiseFinishedRendering){
                    console.log("THe component gave us a promise when their rendering is finished, lets wait");
                    await promiseFinishedRendering;
                }
                resolve(true);
            });
        });

        await promiseClear; //in order to update the image, we need to clear it first
        return await promise;
    }

    static async reactComponentToImageDataURL(children, promiseFinishedRendering, height=ReactComponentToHTMLImageRenderer.DEFAULT_HEIGHT, width=ReactComponentToHTMLImageRenderer.DEFAULT_WIDTH){
        let componentRef = React.createRef();
        const element = <div ref={componentRef} style={{width: width, height: height}}>
            {children}
        </div>;
        console.log("Start Render");
        await ReactComponentToHTMLImageRenderer.renderElement(element, promiseFinishedRendering);
        //await ReactComponentToHTMLImageRenderer.sleep(2000);
        console.log("Render Finished completly now getting image");
        let dataURL = await ReactComponentToHTMLImageRenderer.reactNodeToDataURL(componentRef);
        return dataURL;
    }

    static async reactComponentToImgage(children, promiseFinishedRendering){
        let dataURL = await ReactComponentToHTMLImageRenderer.reactComponentToImageDataURL(children, promiseFinishedRendering);
        return '<img src="'+dataURL+'" />';
    }

    static async reactComponentToImgageTag(children, promiseFinishedRendering){
        let dataURL = await ReactComponentToHTMLImageRenderer.reactComponentToImageDataURL(children, promiseFinishedRendering);
        return <img src={dataURL} />;
    }

}
