import ReactDOM from 'react-dom';
import ServerWeb from "./ServerWeb";
import AppMenu from "./AppMenu";
import AppMenuItem from "./AppMenuItem";
import DefaultComponent from "./screens/home/DefaultComponent";
import HomeComponent from "./screens/home/HomeComponent";
import ExampleLogoComponent from "./exampleApplication/ExampleLogoComponent";

const config = {
    "title": "NSFW-Dev",
    "titleLong": "NSFW-Dev",
    "githubLink": "https://github.com/NilsBaumgartner1994/GEG",
    "version": "1.0.0",
    "preferedAuthMethod": "myUOS"
}

ServerWeb.setConfig(config);

AppMenu.setLogoComponent(ExampleLogoComponent);
AppMenu.setLogoSrc("/assets/images/logo.png");

//AppMenu.hideAllDefaultMenuContent();
let customMenu = new AppMenuItem("MyCustomMenu", DefaultComponent);
let defaultTest = new AppMenuItem("DefaultTest", DefaultComponent);
customMenu.addChildren(defaultTest);
AppMenu.addRouteWithoutMenu("/test/:test_id", DefaultComponent);

defaultTest.addChildren(new AppMenuItem("SubDefaultTest", DefaultComponent));
defaultTest.addChildren(new AppMenuItem("AnotherSubDefaultTest", HomeComponent));

customMenu.addChildren(new AppMenuItem("HomeTest", HomeComponent));
customMenu.addChildren(new AppMenuItem("ExternalLinkTest", DefaultComponent).setExternLink("https://github.com/"));
AppMenu.addMenuWithRoutes(customMenu);

AppMenu.addRouteWithoutMenu("/hiddenRoute", DefaultComponent);

AppMenu.setCustomHomeComponent(DefaultComponent);

ServerWeb.start(ReactDOM);
