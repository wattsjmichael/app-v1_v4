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

    local.registerplugin = function (krpanointerface, pluginpath, pluginobject) {


        // get the krpano interface and the plugin object
        krpano = krpanointerface;
        plugin = pluginobject;

        // add plugin action (the attribute needs to be lowercase!)
        //plugin.set_elevations = set_elevations;
        plugin.registerattribute("show_video", show_video);
        plugin.registerattribute("show_html", show_html);
        plugin.registerattribute("play_voice", play_voice);
        plugin.registerattribute("show_placard", show_placard);
        plugin.registerattribute("show_quiz", show_quiz);
        plugin.registerattribute("show_end", show_end);
        plugin.registerattribute("show_vid_lib", show_vid_lib);
        plugin.registerattribute("show_video_menu", show_video_menu);
        plugin.registerattribute("next_query", next_query);
        // plugin.registerattribute("show_start", show_start);
        plugin.registerattribute("hide_overlay", hide_overlay);
        plugin.registerattribute("speak_azure", speak_azure);
        plugin.registerattribute("show_floor_menu", show_floor_menu);
        plugin.registerattribute("show_tower_menu", show_tower_menu);
        plugin.registerattribute("show_item_lib", show_item_lib);
        plugin.registerattribute("pause_tour", pause_tour);
        plugin.registercontentsize(window.innerWidth, window.innerHeight);

        // production config
        speechConfig = SpeechSDK.SpeechConfig.fromSubscription("76b307fde6994274873e229e80e7c5e2", "eastus");
        try {
            vid_lib = krpano.get('data[vid_lib_data].content');
        } catch (e) {
            console.log("ERROR", "Cant read video menu data from project.xml");
        }
    }

    // unloadplugin - exit point for the plugin (optionally)
    local.unloadplugin = function () {
        plugin = null;
        krpano = null;
    }

    local.onresize = function (width, height) {
        plugin.registercontentsize(window.innerWidth, window.innerHeight);
        return true;
    }

    function show_vid_lib() {

        hide_overlay();
        current_type = "html";

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
            <div id="vid_lib" class="flex-container animated fadeIn bg-overlay"><div class="row"> 
            <div class="flex-item">`
            + vid_lib.trim() +
            `</div>
            <div class="flex-item" style="text-align:center">
                <img id="close_but" style="cursor:pointer;padding-top:1em" src="../app-v4_ipc/skin/ak/close_but.png" width="60" height="60" />
            </div>
        </div></div>
            </div>`;

        plugin.sprite.appendChild(container);
        let vid_links = document.getElementsByClassName("vid_link");
        Array.from(vid_links).forEach(element => {
            element.onclick = function () {
                var o = krpano.get('data["' + element.dataset.url + '" ].content');
                //var o =  '[{ "src": [ "' + element.dataset.url + '" ]}]';
                show_video_menu(o.trim());
            }
        });

        let close_but = document.getElementById("close_but");
        if (close_but) {
            close_but.onclick = function () {
                hide_overlay();
            }
        }
        plugin.visible = true;
    }

    function next_query() {
        let search_item = sessionStorage.getItem("search_item");
        let next_item = krpano.get('hotspot[' + search_item + '].next');
        let paused = sessionStorage.getItem("paused");
        // if (paused == "yes") {
        //     console.log("pause is on");
        // } else {
        //     console.log("pause is off");

        // }
        //if (paused == "no") {
        if (next_item) {
            krpano.call('find_item(' + next_item + ')');
        }
        //}

    }

    function play_voice(n) {
        hide_overlay();
        current_type = "voice";
        let query_data = krpano.get('data[' + n + ']');
        speak_azure(query_data.say, query_data.content.trim());
    }

    function pause_tour(n) {
        let paused = sessionStorage.getItem("paused");
        if (current_type == "voice" || current_type == "html") {
            if (player) {
                if (player.privIsPaused) {
                    player.resume();

                } else {
                    player.pause();

                }
            }
        }
        if (current_type == "video") {
            if (amp_player) {
                if (amp_player.paused()) {

                    amp_player.play();
                } else {
                    amp_player.pause();

                }
            }
        }
    }

    function speak_azure(txt, cc, adv) {

        if (txt) {


            current_type = "voice";
            plugin.visible = true;

            // TEXT BUBBLE

            // SPEECH SYNTH
            voice_cancelled = false;
            player = new SpeechSDK.SpeakerAudioDestination();
            synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, SpeechSDK.AudioConfig.fromSpeakerOutput(player));
            let synthesisText = '<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US">\r\n\t<voice name="en-US-GuyNeural">\r\n\t\t' + txt + '</voice></speak>';

            //player.onAudioStart = function (s) {};
            if (cc) {
                krpano.set('layer[cc].visible', true);
                krpano.set('layer[cc].cc', cc);

            }

            if (!adv) {
                try {

                    player.onAudioEnd = function (s) {

                        hide_overlay();
                        next_query();



                        if (voice_cancelled == true) {
                            voice_cancelled = false;
                        } else {
                            // if (cb) {
                            //checkForPoi();
                            // }
                        }
                        //console.log("onAudioEnd");
                    };
                } catch (e) {
                    //  nothing to see hear!
                }
            }
            //complete_cb = function (result) {
            //	synthesizer.close();
            //	synthesizer = undefined;
            //};

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
            //`<img src="../app-v1/skin/ak/close_but.png"  id="close_but" />
            `</div>
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        // let close_but = document.getElementById("close_but");
        // close_but.onclick = function () {
        //     hide_overlay();
        //     next_query();

        // }
        if (query_data.say != null) {
            if (!query_data.pause) {
                speak_azure(query_data.say);
            } else {
                speak_azure(query_data.say, false, true);
            }
        }
        plugin.visible = true;
    }

    function show_html(n) {

        hide_overlay();
        current_type = "html";

        let query_data = krpano.get('data[' + n + ']');

        var container = document.createElement("div");
        container.innerHTML = query_data.content.trim();

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_me");
        if (close_but) {
            close_but.onclick = function () {
                hide_overlay();
                next_query();
            }
        }
        document.querySelectorAll('.branch').forEach(item => {
            item.addEventListener('click', event => {
                if (item.dataset.teleport != "true") {
                    krpano.call('find_item(' + item.dataset.next + ')')
                } else {
                    krpano.call('find_item_teleport(' + item.dataset.next + ')')

                }
            })
        });
        if (query_data.say != null) {
            if (!query_data.pause) {
                speak_azure(query_data.say);
            } else {
                speak_azure(query_data.say, false, true);
            }
        }
        plugin.visible = true;
    }

    function show_end(n) {

        hide_overlay();
        current_type = "html";

        let query_data = krpano.get('data[' + n + ']');

        var container = document.createElement("div");
        container.innerHTML = query_data.content.trim();

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_me");
        close_but.onclick = function () {

            sessionStorage.setItem("mode", "explore");
            let l = sessionStorage.getItem("startfloor");
            window.location.href = document.location.origin + document.location.pathname + '?startfloor=' + l;


        }
        if (query_data.say != null) {
            speak_azure(query_data.say, false, true);
        }
        plugin.visible = true;
    }

    function stop_azure() {
        // console.log(plugin);
    }

    function show_quiz(n) {

        hide_overlay();
        current_type = "html";

        let query_data = krpano.get('data[' + n + ']');

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
            <div class="flex-container animated fadeIn bg-gradient">
                <div class="row">
                        <div class="flex-item quiz">`
            + query_data.content.trim() +
            `</div>
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);

        document.querySelectorAll('.quiz_item').forEach(item => {
            item.addEventListener('click', event => {
                // console.log(synthesizer)
                //stop_azure();
                let c = document.getElementById("correct");
                let msg = c.dataset.message;


                document.querySelectorAll('.quiz_item').forEach(item_2 => {
                    item_2.style.opacity = ".3";
                    item_2.style.border = "2px solid red";
                });


                document.getElementById("correct").parentNode.style.border = "2px solid green";
                document.getElementById("correct").parentNode.style.opacity = "1";
                if (event.target.id == "correct") {
                    speak_azure("Correct. " + msg, false, false);
                } else {
                    speak_azure("False. " + msg, false, false);
                }

            })
        });
        if (query_data.say != null) {
            speak_azure(query_data.say, false, true);
        }
        plugin.visible = true;
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
                        <video id="video" class="azuremediaplayer amp-default-skin"></video>
                        <div class="flex-item" style="text-align:center">
                            <img src="../app-v1_4_ipc/skin/ak/close_but.png" id="close_but" />
                        </div>
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onclick = function () {
            amp_player.dispose();
            hide_overlay();
            show_vid_lib();

        }

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
                        <video id="video" class="azuremediaplayer amp-default-skin"></video>
                        <!--<div class="flex-item" style="text-align:center">
                            <img src="../app-v1_4_ipc/skin/ak/close_but.png" id="close_but" />
                        </div>-->
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        // let close_but = document.getElementById("close_but");
        // close_but.onclick = function () {
        //     amp_player.dispose();
        //     hide_overlay();
        //     next_query();

        // }

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
            next_query();
        });

        amp_player.playlist(videos);



    }

    function show_floor_menu(html) {

        hide_overlay();
        current_type = "html";
        plugin.visible = true;

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
                <div class="flex-container animated fadeIn bg-overlay">
                    <div class="row">`
            + html +
            //`<div class="flex-item" style="text-align:center">
            //        <img src="../app-v1/skin/ak/close_but.png" id="close_but" />
            //  </div>
            `</div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onclick = function () {
            hide_overlay();
        }


    }

    function show_tower_menu(html) {

        hide_overlay();
        current_type = "html";
        plugin.visible = true;

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
                <div class="flex-container animated fadeIn bg-overlay">
                    <div class="row">`
            + html +
            //`<div class="flex-item" style="text-align:center">
            //        <img src="../app-v1/skin/ak/close_but.png" id="close_but" />
            //  </div>
            `</div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onclick = function () {
            hide_overlay();
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
        plugin.visible = false;
        plugin.sprite.innerHTML = "";
        current_type = null;

    }

    function show_item_lib(scene, floor_id) {


        hide_overlay();
        current_type = "html";
        plugin.visible = true;

        let item_lib_content = `<h3>Floor Feature Menu</h3>
            <p><span style="color:grey;">Safety Features:</span></p>
            <div id="item-fire-ext"></div>
            <div id="item-evac-chair"></div>
            <div id="item-defib"></div>
            <div id="item-first-aid"></div>
            <p><span style="color:grey;">Stairs</span></p>
            <div id="item-stairs"></div>
            <p><span style="color:grey;">Closest Features</span></p>
            <div id="item-closest">
            <a style='cursor:pointer;' data-item='fire_ext' class='item-closest-link'><img src='../app-v1_4_ipc/skin/ak/hotspots/fire_ext.png' width='45' height='45' /></a>
            <a style='cursor:pointer;' data-item='aed' class='item-closest-link'><img src='../app-v1_4_ipc/skin/ak/hotspots/defib.png' width='45' height='45' /></a>
            <a style='cursor:pointer;' data-item='stair' class='item-closest-link'><img src='../app-v1_4_ipc/skin/ak/hotspots/stairwell.png' width='45' height='45' /></a>
            </div>
            <p><span style="color:grey;">Auto Navigate</span></p>
            <div id="auto-nav">
            <a data-mode='on' class='auto-nav-on'>On</a>
            <span style="color:grey;">|</span> 
            <a data-mode='off' class='auto-nav-off'>Off</a>
            </div>`;


        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
                <div class="flex-container animated fadeIn bg-overlay">
                    <div class="row">`
            + item_lib_content +
            `<div class="flex-item" style="text-align:center">
                            <img src="../app-v1_4_ipc/skin/ak/close_but.png" id="close_but" />
                        </div>
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_but");
        close_but.onclick = function () {
            hide_overlay();
        }

        let ov = krpano.get('plugin[scene]');
        let o = ov.get_path_data(true), x;
        // let o = window.tour_path, x;
        let stairs_here = '';

        // console.log(ov.get_path_data(true));
        for (var p in o) {

            x = o[p];

            // if (x.floor == floor_id) {


            if (x.items.length > 0) {
                for (var i = 0; i < x.items.length; i++) {
                    //console.log(p, x.items[i]);
                    if (x.items[i] == "fire_ext") {
                        document.getElementById("item-fire-ext").innerHTML += "<a data-item='fire_ext' data-label='" + p + "' class='item-lib-link'><img src='../app-v1_4_ipc/skin/ak/hotspots/fire_ext.png' width='45' height='45' /></a>";
                    }
                    if (x.items[i] == "first_aid") {
                        document.getElementById("item-first-aid").innerHTML += "<a data-item='first_aid' data-label='" + p + "' class='item-lib-link'><img src='../app-v1_4_ipc/skin/ak/hotspots/first_aid.png' width='45' height='45' /></a>";
                    }
                    if (x.items[i] == "defib" || x.items[i] == "aed") {
                        document.getElementById("item-defib").innerHTML += "<a data-item='aed' data-label='" + p + "' class='item-lib-link'><img src='../app-v1_4_ipc/skin/ak/hotspots/defib.png'  width='45' height='45'/></a>";
                    }
                    if (x.items[i] == "evac_chair") {
                        document.getElementById("item-evac-chair").innerHTML += "<a style='cursor:pointer;' data-item='evac_chair' data-label='" + p + "' class='item-lib-link'><img src='../app-v1_4_ipc/skin/ak/hotspots/evac_chair.png'  width='45' height='45'/></a>";
                    }
                }
            }

            if (x.stair) {
                stairs_here += (x.stair.toUpperCase() + ',');
                document.getElementById("item-stairs").innerHTML += "<a style='padding:.5em;font-size:1.3em' data-label='" + p + "' data-item='stair' class='item-lib-link'>" + x.stair.toUpperCase(); + " </a>";
            }
            // }
        }

        let current_item = document.querySelectorAll("[data-label='" + scene + "']");
        if (current_item.length > 0) {
            current_item[0].style.opacity = .5;
        }

        let links = document.getElementsByClassName('item-lib-link');

        for (var l in links) {
            links[l].onclick = function () {
                sessionStorage.setItem("search_item", this.dataset.item);
                krpano.call('shoosh("' + this.dataset.label + '")');
                hide_overlay();
            }
        }

        let closest = document.getElementsByClassName('item-closest-link');


        for (var c in closest) {
            closest[c].onclick = function () {
                sessionStorage.setItem("search_item", this.dataset.item);
                krpano.call('find_item("' + this.dataset.item + '")');
                hide_overlay();
            }
        }
    }

}
