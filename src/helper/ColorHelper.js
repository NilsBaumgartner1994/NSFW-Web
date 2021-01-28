import React, {Component} from "react";

export class ColorHelper extends Component {

    static getRandomColor() {
        let letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    static hex(x) {
        x = x.toString(16);
        return (x.length == 1) ? '0' + x : x;
    };

    static interpolateMinMaxValue(color1,color2,min,max,value){
        //500 --> 0
        // 10000 -> 1
        // value -->
        let newValue = value-min;
        let newMax = max-min;
        let ratio = newValue/newMax;

	if(min===max){
	    ratio = 1;
	}

        return ColorHelper.interpolate(color1,color2,ratio);
    }

    static interpolate(color1,color2,ratio){
	if(color1.startsWith("#")){
	    color1 = color1.substring(1,color1.length);
	}
	if(color2.startsWith("#")){
	    color2 = color2.substring(1,color2.length);
	}

	if(ratio==0 || isNaN(ratio)){
	    return "#"+color2;
	}

        let r = Math.ceil(parseInt(color1.substring(0,2), 16) * ratio + parseInt(color2.substring(0,2), 16) * (1-ratio));
        let g = Math.ceil(parseInt(color1.substring(2,4), 16) * ratio + parseInt(color2.substring(2,4), 16) * (1-ratio));
        let b = Math.ceil(parseInt(color1.substring(4,6), 16) * ratio + parseInt(color2.substring(4,6), 16) * (1-ratio));

        let middle = ColorHelper.hex(r) + ColorHelper.hex(g) + ColorHelper.hex(b);
        return "#"+middle
    }

}
