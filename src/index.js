import ReactDOM from 'react-dom';
import ServerWeb from "./ServerWeb";
import AppMenu from "./AppMenu";
import AppMenuItem from "./AppMenuItem";
import DefaultComponent from "./screens/home/DefaultComponent";

const config = {
    "title": "NSFW-Dev",
    "titleLong": "NSFW-Dev",
    "githubLink": "https://github.com/NilsBaumgartner1994/GEG",
    "version": "1.0.0",
    "preferedAuthMethod": "myUOS"
}

ServerWeb.setConfig(config);
AppMenu.hideAllDefaultMenuContent();
let customMenu = new AppMenuItem("MyCustomMenu", DefaultComponent);
customMenu.addChildren(new AppMenuItem("DefaultTest", DefaultComponent));
customMenu.addChildren(new AppMenuItem("ExternalLinkTest", DefaultComponent).setExternLink("https://github.com/"));
AppMenu.addMenuWithRoutes(customMenu);

AppMenu.addRouteWithoutMenu("/hiddenRoute", DefaultComponent);

ServerWeb.start(ReactDOM);
