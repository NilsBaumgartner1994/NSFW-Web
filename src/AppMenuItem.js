export default class AppMenuItem {

    constructor(name = "", component=null) {
        this.setMetaKeys([]); //before setName
        this.setChildren([]);


        if (name.length > 0) {
            this.setName(name);
        }
        if(!!component){
            this.setComponent(component);
        }
    }

    setComponent(component) {
        this.component = component;
        return this;
    }

    getComponent() {
        return this.component;
    }

    addMetaKeys(...metaKeys) {
        this.meta = this.meta.concat(metaKeys);
        return this;
    }

    setMetaKeys(metaKeys) {
        this.meta = metaKeys;
        return this;
    }

    getMeta() {
        return this.meta;
    }

    addChildren(...children) {
        this.children = this.children.concat(children);
        return this;
    }

    setChildren(children) {
        this.children = children;
        return this;
    }

    getChildren() {
        return this.children;
    }

    setRoute(route, useParentPath = true) {
        this.route = route;
        this.useParentPath = useParentPath;
        return this;
    }

    getRoute() {
        return this.route;
    }

    getPath(parentPath) {
        let ownPath = this.getRoute();
        if (this.useParentPath) {
            ownPath = parentPath + "/" + ownPath;
        }
        return ownPath;
    }

    setName(name) {
        this.name = name;
        if (!this.getMeta().length) {
            this.addMetaKeys(name);
        }
        if (!this.getRoute()) {
            this.setRoute(name);
        }
        return this;
    }

    getName() {
        return this.name;
    }

    setExternLink(link) {
        this.link = link;
        return this;
    }

    getExternLink() {
        return this.link;
    }

    //not working
    toMenuObject(parentPath = "") {
        let res = {};
        res.name = this.getName();
        res.meta = this.getMeta();
        let ownPath = this.getPath(parentPath);

        if (this.children.length > 0) {
            let childrenObjects = [];
            for (let child of this.children) {
                childrenObjects.push(child.toMenuObject(ownPath));
            }
            res.children = childrenObjects;
        } else {
            let href = this.getExternLink();
            if (!!href && href.length > 0) {
                res.href = href;
            } else {
                res.to = this.getPath(parentPath);
            }
        }
        return res;
    }

    toRouteObject(parentPath) {
        return {
            path: this.getPath(parentPath),
            component: this.getComponent(),
        };
    }

    putChildToList(list, children, parentPath) {
        let ownPath = this.getPath(parentPath);
        for (let child of children) {
            list.push(child.toRouteObject(ownPath));
            child.putChildToList(list, child.getChildren(), ownPath);
        }
    }

    //save, works
    toRouterList(parentPath = "") {
        let res = [this.toRouteObject(parentPath)];
        this.putChildToList(res, this.children, parentPath);
        return res;
    }
}
