---
layout: docpage.html.ejs
title: AkashaRender Configuration object
---
  - [undefined.prepare()](#undefinedprepare)
  - [undefined.addDocumentsDir()](#undefinedadddocumentsdirdirstring)
  - [undefined.addLayoutsDir()](#undefinedaddlayoutsdirdirstring)
  - [undefined.addPartialsDir()](#undefinedaddpartialsdirdirstring)
  - [undefined.addAssetsDir()](#undefinedaddassetsdirdirstring)
  - [undefined.addMahabhuta()](#undefinedaddmahabhutamahafuncsarray)
  - [undefined.setRenderDestination()](#undefinedsetrenderdestinationdirstring)
  - [renderDestination](#renderdestination)
  - [undefined.addMetadata()](#undefinedaddmetadataindexstringvalue)
  - [undefined.rootURL()](#undefinedrooturlroot_urlstring)
  - [undefined.addHeaderJavaScript()](#undefinedaddheaderjavascriptscript)
  - [undefined.addFooterJavaScript()](#undefinedaddfooterjavascriptscript)
  - [undefined.addStylesheet()](#undefinedaddstylesheetscript)
  - [undefined.copyAssets()](#undefinedcopyassets)
  - [undefined.hookSiteRendered()](#undefinedhooksiterendered)
  - [undefined.use()](#undefinedusepluginobj)
  - [undefined.eachPlugin()](#undefinedeachpluginiteratorfinal)
  - [undefined.plugin()](#undefinedpluginnamestring)
  - [undefined.addRenderer()](#undefinedaddrenderer)
  - [undefined.findRenderer()](#undefinedfindrenderer)

## undefined.prepare()

  Initialize default configuration values for anything which has not
  already been configured.  Some built-in defaults have been decided
  ahead of time.  For each configuration setting, if nothing has been
  declared, then the default is substituted.
  
  It is expected this function will be called last in the config file.
  
  This function installs the `built-in` plugin.  It needs to be last on
  the plugin chain so that its stylesheets and partials and whatnot
  can be overridden by other plugins.

## undefined.addDocumentsDir(dir:string)

  Add a directory to the documentDirs configuration array

## undefined.addLayoutsDir(dir:string)

  Add a directory to the layoutDirs configurtion array

## undefined.addPartialsDir(dir:string)

  Add a directory to the partialDirs configurtion array

## undefined.addAssetsDir(dir:string)

  Add a directory to the assetDirs configurtion array

## undefined.addMahabhuta(mahafuncs:Array)

  Add an array of Mahabhuta functions

## undefined.setRenderDestination(dir:string)

  Define the directory into which the project is rendered.

## renderDestination

  Fetch the declared destination for rendering the project.

## undefined.addMetadata(index:string, value:)

  Add a value to the project metadata.  The metadata is combined with
  the document metadata and used during rendering.

## undefined.rootURL(root_url:string)

  Document the URL for a website project.

## undefined.addHeaderJavaScript(script:)

  Declare JavaScript to add within the head tag of rendered pages.

## undefined.addFooterJavaScript(script:)

  Declare JavaScript to add at the bottom of rendered pages.

## undefined.addStylesheet(script:)

  Declare a CSS Stylesheet to add within the head tag of rendered pages.

## undefined.copyAssets()

  Copy the contents of all directories in assetDirs to the render destination.

## undefined.hookSiteRendered()

  Call the onSiteRendered function of any plugin which has that function.

## undefined.use(PluginObj:)

  use - go through plugins array, adding each to the plugins array in
  the config file, then calling the config function of each plugin.

## undefined.eachPlugin(iterator:, final:)

  Iterate over the installed plugins, calling the function passed in `iterator`
  for each plugin, then calling the function passed in `final`.

## undefined.plugin(name:string)

  Look for a plugin, returning its module reference.

## undefined.addRenderer()

  Add a new Renderer to the AkashaRender configuration

## undefined.findRenderer()

  Find a Renderer by its extension.
