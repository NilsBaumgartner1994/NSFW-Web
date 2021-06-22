import ReactDOM from 'react-dom';
import ServerWeb from "./ServerWeb";
import AppMenu from "./AppMenu";
import AppMenuItem from "./AppMenuItem";
import DefaultComponent from "./screens/home/DefaultComponent";
import App from "./App";
import HomeComponent from "./screens/home/HomeComponent";

const config = {
    "title": "NSFW-Dev",
    "titleLong": "NSFW-Dev",
    "githubLink": "https://github.com/NilsBaumgartner1994/GEG",
    "version": "1.0.0",
    "preferedAuthMethod": "myUOS"
}

ServerWeb.setConfig(config);
AppMenu.hideAllDefaultMenuContent();

let customMenu = new AppMenuItem("CustomMenüs", DefaultComponent);
customMenu.addChildren(new AppMenuItem("DefaultTest", DefaultComponent));

let subChild = new AppMenuItem("SubMenu");

let subsubmenu = new AppMenuItem("SubSubMenu", DefaultComponent);
subChild.addChildren(subsubmenu);
subChild.addChildren(new AppMenuItem("AnotherSubSubMenu", DefaultComponent));

let customRoute = new AppMenuItem("NonRelativ", DefaultComponent).setRoute("/ThisIsCustom", false)

customRoute.addChildren(new AppMenuItem("NonRelativSubChild", DefaultComponent));
customRoute.addChildren(subsubmenu);

customMenu.addChildren(customRoute, subChild);


AppMenu.addCustomMenuItem(customMenu);
ServerWeb.start(ReactDOM);
