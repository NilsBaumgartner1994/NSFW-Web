// this should be the entry point to your library
module.exports = {
    ServerWeb: require('./ServerWeb').default, // eslint-disable-line global-require
    App: require('./App').default, // eslint-disable-line global-require
    AppMenu: require('./AppMenu').default, // eslint-disable-line global-require
    AppMenuItem: require("./AppMenuItem").default, // eslint-disable-line global-require
    HeaderTemplate: require('./templates/HeaderTemplate').default, // eslint-disable-line global-require

    StringHelper: require('./helper/StringHelper').default, // eslint-disable-line global-require
    MyFileReaderHelper: require('./helper/MyFileReaderHelper').default, // eslint-disable-line global-require
    DateHelper: require('./helper/DateHelper').default, // eslint-disable-line global-require
    ZipDownloader: require('./helper/ZipDownloader').default, // eslint-disable-line global-require
    ZipExtractHelper: require('./helper/ZipExtractHelper').default, // eslint-disable-line global-require
    DownloadHelper: require('./helper/DownloadHelper').default, // eslint-disable-line global-require

    NumberHelper: require('./helper/NumberHelper').default, // eslint-disable-line global-require
    WindowHelper: require('./helper/WindowHelper').default, // eslint-disable-line global-require
    MyChartHelper: require('./helper/MyChartHelper').default, // eslint-disable-line global-require

    EditableField: require('./screens/dataview/EditableField').default, // eslint-disable-line global-require
    DataTableHelper: require('./screens/dataview/DataTableHelper').default, // eslint-disable-line global-require
    AssociationIndexOverlay: require('./screens/dataview/AssociationIndexOverlay').default, // eslint-disable-line global-require
    DefaultResourceDatatable: require('./screens/dataview/DefaultResourceDatatable').default, // eslint-disable-line global-require
    ResourceCreateComponent: require('./screens/dataview/ResourceCreateComponent').default, // eslint-disable-line global-require
    DataviewCustomization: require("./screens/dataviewCustomization/DataviewCustomization").default, // eslint-disable-line global-require
}
