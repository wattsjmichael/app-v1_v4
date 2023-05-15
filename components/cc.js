/*
    krpano HTML5 Javascript Plugin Example
*/

function krpanoplugin()
{
    var local = this;   // save the 'this' pointer from the current plugin object

    var krpano = null;  // the krpano and plugin interface objects
    var plugin = null;
    let cc = null;

    //var xml_value = 100.0;   // the value for a custom xml attribute

    // registerplugin - startup point for the plugin (required)
    // - krpanointerface = krpano interface object
    // - pluginpath = the fully qualified plugin name (e.g. "plugin[name]")
    // - pluginobject = the xml plugin object itself
    local.registerplugin = function(krpanointerface, pluginpath, pluginobject)
    {
        // get the krpano interface and the plugin object
        krpano = krpanointerface;
        plugin = pluginobject;

        // first - say hello
        //krpano.trace(1, "hello from plugin[" + plugin.name + "]");

        // add plugin attributes
        //plugin.registerattribute("mode", "normal");
        
        // add plugin action (the attribute needs to be lowercase!)
        //plugin.play_video = play_video;
        plugin.registerattribute("resize_overlay", resize_overlay);
        
        
        
        // optionally - add some graphical content:
        
        // register the size of the content
        plugin.registercontentsize(window.innerWidth,100);
        
        var container = document.createElement("div");
        container.innerHTML = `<div id="cc"></div>`;
        
        plugin.sprite.appendChild(container);
        
        plugin.registerattribute("cc", cc, value_setter, value_getter);
    }

    // unloadplugin - exit point for the plugin (optionally)
    // - will be called from krpano when the plugin will be removed
    // - everything that was added by the plugin should be removed here
    local.unloadplugin = function()
    {
        plugin = null;
        krpano = null;
    }

    // onresize (optionally)
    // - width,height = the new size for the plugin
    // - when not defined then only the krpano plugin html element will be sized
    local.onresize = function (width, height) {
        // plugin.registercontentsize(window.innerWidth, window.innerHeight);
        plugin.sprite.style.width = window.innerWidth + 'px';
        // plugin.sprite.style.height = '100%';

        return true;
    }

    function resize_overlay() {
        plugin.sprite.style.width = '100%';
        plugin.sprite.style.height = '100%';
        plugin.registercontentsize(window.innerWidth, window.innerHeight);
        return true;
    }

    function value_setter(v)
    {
        document.getElementById("cc").innerText = v;
        cc = v;

    }

    function value_getter()
    {
        return cc;
    }

}

