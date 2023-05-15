/*
    krpano HTML5 Javascript Plugin Example
*/

function krpanoplugin()
{
    let local = this;   // save the 'this' pointer from the current plugin object
    let krpano = null;  // the krpano and plugin interface objects
    let plugin = null;

    local.registerplugin = function(krpanointerface, pluginpath, pluginobject)
    {


        // get the krpano interface and the plugin object
        krpano = krpanointerface;
        plugin = pluginobject;
        
        // add plugin action (the attribute needs to be lowercase!)
        //plugin.set_elevations = set_elevations;
       // plugin.registerattribute("current_elev", "current_elev");


    }

    // unloadplugin - exit point for the plugin (optionally)
    local.unloadplugin = function()
    {
        plugin = null;
        krpano = null;
    }




}
