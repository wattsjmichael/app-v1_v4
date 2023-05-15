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
    let ios = false;
    let has_played = false;
    let app_version;


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
        // plugin.registerattribute("show_vid_lib", show_vid_lib);
        // plugin.registerattribute("show_video_menu", show_video_menu);
        plugin.registerattribute("hide_overlay", hide_overlay);
        plugin.registerattribute("passthrough", passthrough);
        plugin.registerattribute("speak_azure", speak_azure);
        // plugin.registerattribute("show_floor_menu", show_floor_menu);
        // plugin.registerattribute("show_item_lib", show_item_lib);
        plugin.registerattribute("pause_overlay", pause_overlay);
        plugin.registerattribute("play_overlay", play_overlay);
        plugin.registerattribute("show_interface", show_interface);
        plugin.registerattribute("hide_ff_control", hide_ff_control);
        plugin.registerattribute("resize_overlay", resize_overlay);
        plugin.registercontentsize(window.innerWidth, window.innerHeight);

        // production config
        speechConfig = SpeechSDK.SpeechConfig.fromSubscription("76b307fde6994274873e229e80e7c5e2", "eastus");
        try {
            vid_lib = krpano.get('data[vid_lib_data].content');
        } catch (e) {
            console.log("ERROR", "Cant read video menu data from project.xml");
        }

        hide_media_controls();
        hide_tour_controls();

        ios = isIpadOS() || krpano.get('device.ios');
        // alert(ios);
        app_version = krpano.get('app_version');


    }

    //unloadplugin - exit point for the plugin (optionally)
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
    

    function hide_media_controls() {
        krpano.set('layer[media_controls].alpha', .25);
        krpano.set('layer[media_controls].enabled', false);
    }
    function show_media_controls() {
        krpano.set('layer[media_controls].alpha', 1);
        krpano.set('layer[media_controls].enabled', true);
    }
    function hide_tour_controls() {
        krpano.set('layer[tour_controls].alpha', .25);
        krpano.set('layer[tour_controls].enabled', false);
    }
    function hide_ff_control() {
        krpano.set('layer[tour_controls].alpha', .25);
        krpano.set('layer[tour_controls].enabled', false);
    }
    function show_tour_controls() {
        krpano.set('layer[tour_controls].alpha', 1);
        krpano.set('layer[tour_controls].enabled', true);
    }

    function play_voice(n) {
        hide_overlay();
        current_type = "voice";
        let query_data = krpano.get('data[' + n + ']');
        speak_azure(query_data.say, query_data.content.trim());
        if (query_data.rotate == "true") {
            krpano.call('autorotate.start()');
        }
    }

    function pause_overlay() {
        // console.log("pause");
        // let paused = sessionStorage.getItem("paused");
        if (current_type == "voice" || current_type == "html") {
            if (player) {
                if (player.privIsPaused) {
                    //player.resume();
                } else {
                    player.pause();
                    // paused = "yes";
                }
            }
        }
        if (current_type == "video") {
            if (amp_player) {
                if (amp_player.paused()) {
                    //amp_player.play();
                } else {
                    amp_player.pause();
                    // paused = "yes";
                }
            }
        }
        krpano.set('layer[pause_tour_control].url', '../'  +  app_version + '/skin/ak/play.png');
        // krpano.call('layer[tour_control_bg].loadstyle(play_off)');
        
        // krpano.set('layer[tour_control_bg].style', 'play_off');
        krpano.set('layer[tour_control_bg].bgcolor', '0xFF0000');

    }

    function play_overlay() {
        // console.log("play");
        // let paused = sessionStorage.getItem("paused");
        if (current_type == "voice" || current_type == "html") {
            if (player) {
                if (player.privIsPaused) {
                    player.resume();
                    // pause="no";
                } else {
                    //player.pause();
                }
            }
        }
        if (current_type == "video") {
            if (amp_player) {
                if (amp_player.paused()) {
                    
                    // pause="no";
                    amp_player.play();
                } else {
                    //amp_player.pause();
                }
            }
        }
        krpano.set('layer[pause_tour_control].url', '../'  +  app_version + '/skin/ak/pause.png');
        let x = krpano.call('layer[tour_control_bg].getfullpath()');
        console.log(x);
        // krpano.call('layer[tour_control_bg].loadstyle(play_on)');
        // krpano.set('layer[tour_control_bg].style', 'play_on');
        krpano.set('layer[tour_control_bg].bgcolor', '0x00FF00');
    }

    function speak_azure(txt, cc, adv, auto) {
        // txt (spoken) cc (shown) adv (play nect query if true) auto (assume no autoplay block)
        if (txt) {

            console.log("volume: 65");

            try {
                voice_cancelled = true;
                player.pause();
                player.close();
            } catch (err) {
                // error
            }


            current_type = "voice";
            plugin.visible = true;

            // TEXT BUBBLE

            // SPEECH SYNTH
            voice_cancelled = false;
            player = new SpeechSDK.SpeakerAudioDestination();
            synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, SpeechSDK.AudioConfig.fromSpeakerOutput(player));
            let synthesisText = '<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US">\r\n\t<voice name="en-US-GuyNeural">\r\n\t\t<prosody volume="65">' + txt + '</prosody></voice></speak>';

            //player.onAudioStart = function (s) {};
            if (cc) {
                krpano.set('layer[cc].visible', true);
                krpano.set('layer[cc].cc', cc);
            }

            show_media_controls();
            show_tour_controls();

            if (!adv) {
                try {

                    player.onAudioEnd = function (s) {

                        hide_overlay();
                        krpano.call('plugin[tour].next_query("no")');

                        if (voice_cancelled == true) {
                            voice_cancelled = false;
                        } else {
                            alert("VOICE CANCELED", voice_cancelled);
                            // if (cb) {
                            //checkForPoi();
                            // }
                        }
                        console.log("onAudioEnd");
                    };
                } catch (e) {
                   // console.log("ERROR", e);
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
            //                     setTimeout(function() {
            //     console.log(player.privPlaybackStarted);
            // }, 3000);
                    // console.log("Is speaking:", player.privPlaybackStarted);
                    // if (!player.privPlaybackStarted) {
                    //     krpano.call('plugin[tour].toggle_pause()');
                    // }
                },
                function (err) {
                    window.console.log(err);
                    synthesizer.close();
                    synthesizer = undefined;
                }
            );

            // player.onAudioStart = function (s) {
            //     console.log("ff");
            // }
            
            // setTimeout(function() {
            //     console.log(player.privPlaybackStarted);
            // }, 3000);

            if (!auto) {
                if (ios || !has_played) {
                     player.pause();
                     krpano.set('layer[pause_tour_control].url', '../'  +  app_version + '/skin/ak/play.png');
                     krpano.set('layer[tour_control_bg].bgcolor', '0xFF0000');
                    //  krpano.set('layer[tour_control_bg].style', 'play_on');
                     sessionStorage.setItem("paused", "yes");
                     krpano.call('plugin[tour].set_pause("yes")');
                     krpano.call('tween_but_up()');
                 }
            }
            
            has_played = true;

        } else {
            throw "NOTHING TO SAY :(";
        }
    }

    function isIpadOS() {
        return navigator.maxTouchPoints &&
          navigator.maxTouchPoints > 2 &&
          /MacIntel/.test(navigator.platform);
    }

    function passthrough(n) {

        hide_overlay();
        current_type = "passthrough";

        // let query_data = krpano.get('data[' + n + ']');

        krpano.call('delayedcall(1,plugin[tour].next_query("no"))');
        plugin.visible = true;
    }

    function show_placard(n) {

        hide_overlay();
        current_type = "html";

        // get the data via class if needed
        let query_data = krpano.get('data[' + n + ']');
        

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
            <div class="flex-container bg-gradient">
                <div class="row fadeIn animated menu-mover">
                        <div class="flex-item placard">`
            + query_data.content.trim() +
            `</div>
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);
        // let close_but = document.getElementById("close_but");
        // close_but.onpointerup = function () {
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

    function show_interface(n) {

        hide_overlay();
        current_type = "html";

        let query_data = krpano.get('data[' + n + ']');
        let x = Number(query_data.x);
        let y = Number(query_data.y);
        let r = query_data.r;
        let el = query_data.el
        
        let graphic = krpano.get('layer[' + el + '].sprite');
        let rect = graphic.getBoundingClientRect();


        var container = document.createElement("div");
        // container.innerHTML = query_data.content.trim();
        let contents = query_data.content.trim();
        let ww = window.innerWidth;
        let wh = window.innerHeight;
        // <span style="font-size:2.5em;line-height:1.5em;font-color:white">` + contents +  `</span><br>
        container.innerHTML = `<div id="overlay-content">
        <div class="flex-container bg-gradient">
        <div class="row menu-mover">
        <div class="flex-item" style="padding:1em;text-align:center;font-size:1.75em;line-height:2em;color:#444444;">` + contents +  `</div>
                </div>
            </div>
        </div>
        <img class="arrow-pointer blink-animation" style="top:` + (rect.top += y) + `px;left:` + (rect.left += x) + `px;transform: rotate(` + r + `deg);" src="../`  +  app_version + `/skin/ak/arrow_pointer.png"/>`;

        plugin.sprite.appendChild(container);
        let close_but = document.getElementById("close_me");
        if (close_but) {
            close_but.onpointerup = function () {
                hide_overlay();
                // next_query();
                krpano.call('plugin[tour].next_query("no")');
            }
        } 
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

        if (query_data.say != null) {
            if (!query_data.pause) {
                speak_azure(query_data.say);
            } else {
                speak_azure(query_data.say, false, true);
            }
        }

        var container = document.createElement("div");

        container.innerHTML = `<div id="overlay-content">
        <div class="flex-container bg-gradient">
            <div class="row fadeIn animated menu-mover">` 
                + query_data.content.trim(); +
            `</div></div></div>`;

        plugin.sprite.appendChild(container);
        document.querySelectorAll('.branch').forEach(item => {
            item.addEventListener('pointerdown', event => {
                let ofloor = item.dataset.ofloor;
                if (ofloor) {
                   sessionStorage.setItem("originatingfloor", ofloor);
                }
                if (item.dataset.teleport != "true") {
                    krpano.call('plugin[tour].next_query("no",' + item.dataset.next + ')');
                } else {
                    krpano.call('plugin[tour].next_query("yes",' + item.dataset.next + ')');

                }
            })
        });

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
        let e = close_but.dataset.endpano;
        close_but.onpointerup = function () {

            sessionStorage.removeItem("tour_history");
            sessionStorage.removeItem("tour_index");
            sessionStorage.setItem("mode", "explore");
            console.log(e);
            if (e) {
                window.location.href = document.location.origin + document.location.pathname + '?startscene=' + e;
            } else {
                let l = sessionStorage.getItem("originatingfloor");
                window.location.href = document.location.origin + document.location.pathname + '?startfloor=' + l;
            }
            krpano.call("send_accomp('completed_tour')");

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
        show_media_controls();
        show_tour_controls();
        current_type = "html";

        let query_data = krpano.get('data[' + n + ']');

        var container = document.createElement("div");
        container.innerHTML = `<div id="overlay-content">
            <div class="flex-container bg-gradient">
                <div class="row fadeIn animated menu-mover">
                        <div class="flex-item quiz">`
            + query_data.content.trim() +
            `</div>
                    </div>
                </div>
            </div>`;

        plugin.sprite.appendChild(container);

        document.querySelectorAll('.quiz_item').forEach(item => {
            item.addEventListener('pointerdown', event => {
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
                    speak_azure("Correct. " + msg, false, false, true);
                } else {
                    speak_azure("Incorrect. " + msg, false, false, true);
                }

            })
        });
        if (query_data.say != null) {
            speak_azure(query_data.say, false, true, true);
        }
        plugin.visible = true;
    }

    function show_video(n) {
        
        hide_overlay();
        show_media_controls();
        show_tour_controls();
        current_type = "video";
        plugin.visible = true;

        let query_data = krpano.get('data[' + n + ']');

        let autoplay = true;
        let videos = false;
        let content = query_data.content;

        if (query_data.video_id) {
            content = krpano.get('data["' + query_data.video_id + '"].content');
        }
        try {
            videos = JSON.parse(content.trim());
        } catch (e) {
            console.log("ERROR", "JSON failed")
        }

        var container = document.createElement("div");
        // <div class="flex-container bg-gradient">
        //     <div class="row"> 
        //         <video id="video" class="azuremediaplayer amp-default-skin" webkit-playsinline playsinline></video>
        //     </div>
        // </div>
        container.innerHTML = `<div id="overlay-content">
        <div class="flex-container bg-gradient">
            <div class="row menu-mover"> 
            <img id="preview" width="100%" />
            <video id="video" class="azuremediaplayer amp-default-skin" webkit-playsinline playsinline></video>
            </div>
            </div>`;
        plugin.sprite.appendChild(container);
        if (ios) {
            autoplay = false;
            if (query_data.preview) {
                document.getElementById("preview").src = query_data.preview;
            }

            //preview = query_data.preview || false;
        } else {
            document.getElementById("preview").style.display = "none";
            document.getElementById("video").style.display = "block";
        }

            amp_player = amp("video", {
                /* Options */
                "nativeControlsForTouch": false,
                "fluid": true,
                "logo": { "enabled": false },
                autoplay: autoplay,
                controls: true,
                // volume: .5,
                poster: false
            });

            // console.log(amp_player);
            // console.log(amp_volume);
    
            amp_player.addEventListener('ended', function () {
                this.dispose();
                hide_overlay();
                // next_query();
                krpano.call('plugin[tour].next_query("no")');
            });
    
            amp_player.playlist(videos);
            amp_player.addEventListener('pause', function() {
                sessionStorage.setItem("paused", "yes");
                krpano.call('plugin[tour].set_pause("yes")');
                // krpano.set('plugin[tour].paused','yes');
                pause_overlay();
    
            });
            amp_player.addEventListener('play', function() {
                
                document.getElementById("preview").style.display = "none";
                document.getElementById("video").style.display = "block";
                sessionStorage.setItem("paused", "no");
                krpano.call('plugin[tour].set_pause("no")');
                krpano.call('stop_but_tween()');
                // krpano.set('plugin[tour].paused','no');
                // krpano.call("stop_but_tween()");
                play_overlay();
            });        



        if (ios || !has_played) {
            //amp_player.pause();
            krpano.set('layer[pause_tour_control].url', '../'  +  app_version + '/skin/ak/play.png');
            krpano.set('layer[tour_control_bg].bgcolor', '0xFF0000');
            // krpano.set('layer[tour_control_bg].style', 'play_off');
            sessionStorage.setItem("paused", "yes");
            krpano.call('plugin[tour].set_pause("yes")');
            krpano.call('tween_but_up()');
        }

        if (!has_played) {
            //amp_player.pause();
        }

    }

    function hide_overlay() {
        krpano.call('gyro_off()');
        hide_media_controls();
        if (current_type == "video") {
            try {
                amp_player.dispose();
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

}
