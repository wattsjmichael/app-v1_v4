/*
    krpano HTML5 Javascript Plugin Example
*/

function krpanoplugin() {

    let local = this;   // save the 'this' pointer from the current plugin object
    let krpano = null;  // the krpano and plugin interface objects
    let plugin = null;
    let current_type = null;
    let amp_player = null;
    let voice_cancelled = false;
    let synthesizer = null;
    let player = null;
    let speechConfig = null;
    let vid_lib = null;
    let app_version;

    local.registerplugin = function (krpanointerface, pluginpath, pluginobject) {


        // get the krpano interface and the plugin object
        krpano = krpanointerface;
        plugin = pluginobject;

        // add plugin action (the attribute needs to be lowercase!)
        //plugin.set_elevations = set_elevations;
        plugin.registerattribute("show_video", show_video);
        // plugin.registerattribute("show_html", show_html);
        // plugin.registerattribute("play_voice", play_voice);
        plugin.registerattribute("show_placard", show_placard);
        plugin.registerattribute("show_html_placard", show_html_placard);
        plugin.registerattribute("show_welcome", show_welcome);
        plugin.registerattribute("show_vid_lib", show_vid_lib);
        plugin.registerattribute("show_video_menu", show_video_menu);
        // plugin.registerattribute("next_query", next_query);
        plugin.registerattribute("hide_overlay", hide_overlay);
        plugin.registerattribute("speak_azure", speak_azure);
        plugin.registerattribute("show_floor_menu", show_floor_menu);
        plugin.registerattribute("show_item_lib", show_item_lib);
        plugin.registerattribute("resize_overlay", resize_overlay);
        plugin.registercontentsize(window.innerWidth, window.innerHeight);
        // plugin.dosomething = action_dosomething;
        // production config
        speechConfig = SpeechSDK.SpeechConfig.fromSubscription("76b307fde6994274873e229e80e7c5e2", "eastus");
        try {
            vid_lib = krpano.get('data[vid_lib_data].content');
        } catch (e) {
            console.log("ERROR", "Cant read video menu data from project.xml");
        }
        app_version = krpano.get('app_version');
    }

    // unloadplugin - exit point for the plugin (optionally)
    local.unloadplugin = function () {
        plugin = null;
        krpano = null;
    }

    local.onresize = function (width,height) {
        plugin.sprite.style.width = '100%';
        plugin.sprite.style.height = '100%';
        return true;
    }

    function resize_overlay() {
        plugin.sprite.style.width = '100%';
        plugin.sprite.style.height = '100%';
        plugin.registercontentsize(window.innerWidth, window.innerHeight);
        return true;
    }

    function show_vid_lib() {

        hide_overlay();
        current_type = "html";

        var container = document.createElement("div");
        container.setAttribute("id", "overlay-content");
        container.innerHTML = `
            <div id="vid_lib" class="flex-container animated fadeIn bg-overlay"><div class="row"> 
            <div class="flex-item">`
            + vid_lib.trim() +
            `</div>
            <div class="flex-item" style="text-align:center">
                <img id="close_but" style="cursor:pointer;padding-top:1em" src="../`  +  app_version + `/skin/ak/close_but.png" width="60" height="60" />
            </div>
        </div></div>`;

        // krpano.set('layer[minimap_container].visible', false);
        plugin.sprite.appendChild(container);
        let vid_links = document.getElementsByClassName("vid_link");
        Array.from(vid_links).forEach(element => {
            element.onpointerup = function () {
                var o = krpano.get('data["' + element.dataset.url + '" ].content');
                //var o =  '[{ "src": [ "' + element.dataset.url + '" ]}]';
                show_video_menu(o.trim());
            }
        });

        let close_but = document.getElementById("close_but");
        if (close_but) {
            close_but.onpointerup = function () {
                hide_overlay();
            }
        }
        plugin.visible = true;
    }

    function speak_azure(txt) {

        if (txt) {

            try {
                voice_cancelled = true;
                player.pause();
                player.close();
            } catch (err) {
                // error
            }


            current_type = "voice";
            // plugin.visible = true;

            // TEXT BUBBLE

            // SPEECH SYNTH
            voice_cancelled = false;
            player = new SpeechSDK.SpeakerAudioDestination();
            synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, SpeechSDK.AudioConfig.fromSpeakerOutput(player));
            let synthesisText = '<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US">\r\n\t<voice name="en-US-GuyNeural">\r\n\t\t<prosody volume="65">' + txt + '</prosody></voice></speak>';
            // let synthesisText = '<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US">\r\n\t<voice name="en-US-GuyNeural">\r\n\t\t' + txt + '</voice></speak>';


            synthesizer.speakSsmlAsync(
                synthesisText,
                function (result) {
                    synthesizer.close();
                    synthesizer = undefined;
                },
                function (err) {
                    window.console.log(err);
                    synthesizer.close();
                    synthesizer = undefined;
                }
            );



        } else {
            throw "NOTHING TO SAY :(";
        }
    }

    function show_welcome(n) {

        if (sessionStorage.getItem("welcome") == "no") {
            let query_data = krpano.get('data[' + n + ']');

            var container = document.createElement("div");
            container.innerHTML = `<div id="overlay-content">
            <div class="flex-container animated fadeIn bg-gradient">
            <div class="row">
            <div class="flex-item placard">`
                + query_data.content.trim() +
                `<img src="../` +  app_version + `/skin/ak/close_but.png"  id="close_but" />
            </div>
            </div>
            </div>
            </div>`;

            plugin.sprite.appendChild(container);
            let close_but = document.getElementById("close_but");
            close_but.onpointerup = function () {
                hide_overlay();
                krpano.call("gyro_on()");
                // krpano.call("set(layer[minimap_container].visible, true)");
            }
            plugin.visible = true;
        } else {
            // krpano.call("set(layer[minimap_container].visible, true)");
            krpano.call("gyro_on()");
            // krpano.call("error('sdfsdf')");
        }

        sessionStorage.setItem("welcome", "yes");
    }

    function show_placard(n) {

        hide_overlay();
        current_type = "html";

        let query_data = krpano.get('data[' + n + ']');

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
            <div class="flex-container animated fadeIn bg-gradient">
                <div class="row">
                        <div class="flex-item placard">`
            + query_data.content.trim() +
            `<img src="../`  +  app_version + `/skin/ak/close_but.png"  id="close_but" />
            </div>
                    </div>
                </div>
            </div>`;
        // krpano.set('layer[minimap_container].visible', false);

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onpointerup = function () {
            hide_overlay();
            //next_query();

        }
        if (query_data.say != null) {
            speak_azure(query_data.say);
        }
        plugin.visible = true;
    }

    function show_html_placard(html, say) {

        hide_overlay();
        current_type = "html";

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
            <div class="flex-container animated fadeIn bg-gradient">
                <div class="row">
                        <div class="flex-item placard">`
            + html.trim() +
            `<img src="../`  +  app_version + `/skin/ak/close_but.png"  id="close_but" />
            </div>
                    </div>
                </div>
            </div>`;
        // krpano.set('layer[minimap_container].visible', false);

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onpointerup = function () {
            hide_overlay();

        }
        if (say != null) {
            speak_azure(say);
        }
        plugin.visible = true;
    }




    function stop_azure() {
        // console.log(plugin);
    }



    function show_video_menu(n) {

        hide_overlay();
        current_type = "video";
        plugin.visible = true;

        let videos = JSON.parse(n.trim());

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
                <div class="flex-container animated fadeIn bg-gradient">
                    <div class="row"> 
                        <video id="video" class="azuremediaplayer amp-default-skin" webkit-playsinline playsinline></video>
                        <div class="flex-item" style="text-align:center">
                            <img src="../`  +  app_version + `/skin/ak/close_but.png" id="close_but" />
                        </div>
                    </div>
                </div>
            </div>`;

        // krpano.set('layer[minimap_container].visible', false);
        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onpointerup = function () {
            amp_player.dispose();
            hide_overlay();
            show_vid_lib();
        }
        document.getElementById("video").style.display = "block";

        amp_player = amp("video", {
            /* Options */
            "nativeControlsForTouch": false,
            "fluid": true,
            autoplay: true,
            controls: true,
            logo: { "enabled": false },
            poster: ""
        });

        amp_player.addEventListener('ended', function () {
            this.dispose();
            hide_overlay();
            show_vid_lib();
        });

        amp_player.playlist(videos);



    }
    function show_video(n) {

        hide_overlay();
        current_type = "video";
        plugin.visible = true;

        let query_data = krpano.get('data[' + n + ']');

        let videos = JSON.parse(query_data.content.trim());

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
                <div class="flex-container animated fadeIn bg-gradient">
                    <div class="row"> 
                        <video id="video" class="azuremediaplayer amp-default-skin" webkit-playsinline playsinline></video>
                        <div class="flex-item" style="text-align:center">
                            <img src="../`  +  app_version + `/skin/ak/close_but.png" id="close_but" />
                        </div>
                    </div>
                </div>
            </div>`;

        // krpano.set('layer[minimap_container].visible', false);
        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onpointerup = function () {
            amp_player.dispose();
            hide_overlay();
            //next_query();
        }
        document.getElementById("video").style.display = "block";

        amp_player = amp("video", {
            /* Options */
            "nativeControlsForTouch": false,
            "fluid": true,
            "logo": { "enabled": false },
            autoplay: true,
            controls: true,
            poster: ""
        });

        amp_player.addEventListener('ended', function () {
            this.dispose();
            hide_overlay();
            //next_query();
        });

        amp_player.playlist(videos);



    }

    function show_floor_menu(html) {

        hide_overlay();
        current_type = "html";
        plugin.visible = true;

        var container = document.createElement("div");
        container.setAttribute("id", "overlay-content");
        container.innerHTML = `
                <div class="flex-container animated fadeIn bg-overlay">
                    <div class="row">`
            + html +
            `<div class="flex-item" style="text-align:center">
                   <img src="../`  +  app_version + `/skin/ak/close_but.png" id="close_but" />
             </div>
            </div>
                </div>`;

        // krpano.set('layer[minimap_container].visible', false);
        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onpointerup = function () {
            hide_overlay();

        }
        let links = document.getElementsByClassName('floor_link');

        for (var l in links) {
            links[l].onpointerup = function () {

                window.location.href = this.getAttribute("href");


            }
        }


    }

    function hide_overlay() {
        if (current_type == "video") {
            try {
                // amp_player.dispose();
            } catch (e) {
                console.log(e);
            }
        }
        if (current_type == "html" || current_type == "voice") {
            try {
                voice_cancelled = true;
                player.pause();
                player.close();
            } catch (err) {
                // error
            }
        }
        krpano.set('layer[cc].visible', false);
        // krpano.set('layer[minimap_container].visible', true);
        plugin.visible = false;
        plugin.sprite.innerHTML = "";
        current_type = null;

    }

    function show_item_lib(scene, floor_id) {


        hide_overlay();
        current_type = "html";
        plugin.visible = true;

        let item_lib_content = `<h3>Floor Feature Menu</h3>
            <p><span style="color:grey;">Stairs</span></p>
            <div id="item-stairs"></div><br>
            <p><span style="color:grey;">Safety Features:</span></p>
            <div id="item-fire-ext"></div>
            <div id="item-evac-chair"></div>
            <div id="item-defib"></div>
            <div id="item-first-aid"></div>`;

            // <!--<p><span style="color:grey;">Closest Features</span></p>
            // <div id="item-closest">
            // <a style='cursor:pointer;' data-item='fire_ext' class='item-closest-link'><img src='../`  +  app_version + `/skin/ak/hotspots/fire_ext.png' width='45' height='45' /></a>
            // <a style='cursor:pointer;' data-item='aed' class='item-closest-link'><img src='../`  +  app_version + `/skin/ak/hotspots/defib.png' width='45' height='45' /></a>
            // <a style='cursor:pointer;' data-item='stair' class='item-closest-link'><img src='../`  +  app_version + `/skin/ak/hotspots/stairwell.png' width='45' height='45' /></a>
            // </div>-->
        // <p><span style="color:grey;">Auto Navigate</span></p>
        // <div id="auto-nav">
        // <a data-mode='on' class='auto-nav-on'>On</a>
        // <span style="color:grey;">|</span> 
        // <a data-mode='off' class='auto-nav-off'>Off</a>
        // </div>

        // krpano.set('layer[minimap_container].visible', false);

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
                <div class="flex-container animated fadeIn bg-overlay">
                    <div class="row">`
            + item_lib_content +
            `<div class="flex-item" style="text-align:center">
                            <img src="../`  +  app_version + `/skin/ak/close_but.png" id="close_but" />
                        </div>
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        resize_overlay();
        let close_but = document.getElementById("close_but");
        close_but.onpointerup = function () {
            hide_overlay();
        }

        let ov = krpano.get('plugin[scene]');
        let o = ov.get_path_data(true), x;
        // let o = window.tour_path, x;
        //let stairs_here = '';

        // console.log(ov.get_path_data(true));
        for (var p in o) {

            x = o[p];

            // if (x.floor == floor_id) {


            if (x.items.length > 0) {
                for (var i = 0; i < x.items.length; i++) {
                    //console.log(p, x.items[i]);
                    if (x.items[i] == "fire_ext") {
                        document.getElementById("item-fire-ext").innerHTML += "<a data-item='fire_ext' data-label='" + p + "' class='item-lib-link'><img src='../"  +  app_version + "/skin/ak/hotspots/fire_ext.png' width='45' height='45' /></a>";
                    }
                    if (x.items[i] == "first_aid") {
                        document.getElementById("item-first-aid").innerHTML += "<a data-item='first_aid' data-label='" + p + "' class='item-lib-link'><img src='../"  +  app_version + "/skin/ak/hotspots/first_aid.png' width='45' height='45' /></a>";
                    }
                    if (x.items[i] == "defib" || x.items[i] == "aed") {
                        document.getElementById("item-defib").innerHTML += "<a data-item='aed' data-label='" + p + "' class='item-lib-link'><img src='../"  +  app_version + "/skin/ak/hotspots/defib.png'  width='45' height='45'/></a>";
                    }
                    if (x.items[i] == "evac_chair") {
                        document.getElementById("item-evac-chair").innerHTML += "<a style='cursor:pointer;' data-item='evac_chair' data-label='" + p + "' class='item-lib-link'><img src='../"  +  app_version + "/skin/ak/hotspots/evac_chair.png'  width='45' height='45'/></a>";
                    }
                }
            }

            if (x.stair) {
                // stairs_here += (x.stair.toUpperCase() + ',');
                document.getElementById("item-stairs").innerHTML += "<a style='padding:.5em;font-size:1.3em' data-label='" + p + "' data-item='stairwell' class='item-lib-link'>" + x.stair.toUpperCase(); + " </a>";
            }
            // }
        }

        let current_item = document.querySelectorAll("[data-label='" + scene + "']");
        if (current_item.length > 0) {
            // current_item[0].style.opacity = .5;
            current_item[0].classList.remove("item-lib-link");
        }

        let links = document.getElementsByClassName('item-lib-link');

        for (var l in links) {
            links[l].onpointerup = function () {
                sessionStorage.setItem("search_item", this.dataset.item);
                // krpano.call('shoosh("' + this.dataset.label + '", true)');
                krpano.call('teleport_to_scene("' + this.dataset.label + '","' + this.dataset.item + '")');
                
                hide_overlay();
            }
        }

        // let closest = document.getElementsByClassName('item-closest-link');


        // for (var c in closest) {
        //     closest[c].onpointerup = function () {
        //         sessionStorage.setItem("search_item", this.dataset.item);
        //         krpano.call('find_item("' + this.dataset.item + '")');
        //         hide_overlay();
        //     }
        // }

        var list = document.getElementById('item-stairs');

        var items = list.childNodes;
        var itemsArr = [];
        for (var i in items) {
            if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
                itemsArr.push(items[i]);
            }
        }

        itemsArr.sort(function (a, b) {
            return a.innerHTML == b.innerHTML
                ? 0
                : (a.innerHTML > b.innerHTML ? 1 : -1);
        });

        for (i = 0; i < itemsArr.length; ++i) {
            list.appendChild(itemsArr[i]);
        }
    }

}
