/*
    krpano HTML5 Javascript Plugin Example
*/







function krpanoplugin()
{
    let local = this;   // save the 'this' pointer from the current plugin object
    let krpano = null;  // the krpano and plugin interface objects
    let plugin = null;
    let current_query = null;
    let current_query_name = null;
    let paused = "no";
    let tour_history = [];
    let music = false;
    let tour_index = 0;
    let first_stop = false;
    let app_version;

    local.registerplugin = function(krpanointerface, pluginpath, pluginobject)
    {


        // get the krpano interface and the plugin object
        krpano = krpanointerface;
        plugin = pluginobject;
        
        // add plugin action (the attribute needs to be lowercase!)
        plugin.set_query = set_query;
        plugin.show_query = show_query;
        plugin.tour_back = tour_back;
        plugin.tour_forward = tour_forward;
        plugin.tour_home = tour_home;
        plugin.toggle_pause = toggle_pause;
        // plugin.set_pause = set_pause;
        plugin.start_tour = start_tour;
        plugin.set_pause = set_pause;
        plugin.registerattribute("next_query", next_query);
        

        let a = krpano.get('data').getArray();
        let result = a.filter(x => x['object'] == 'tour');
        if (result) {
            if (result.length > 0) {
                first_stop = result[0].name;
            }
        }
        //console.log(result[0]);
        paused = sessionStorage.getItem("paused");
        music = krpano.get('data[music].url');
        if (music != null) {
            krpano.call('streamsound(bgsnd, get(data[music].url), true)');
        }

        let sesh_ind = sessionStorage.getItem('tour_index');
        if (sesh_ind) {
            tour_index = Number(sesh_ind);
        } else {
            sessionStorage.setItem('tour_index', 0);
        }
        let tour_hist = sessionStorage.getItem('tour_history');
        if (tour_hist) {
            tour_history = tour_hist.split(",");
            tour_history.pop();
            // if the first stop and the tour history first stop are different, delete the tour history and set index to 0;
            if (first_stop != tour_history[0]) {
                sessionStorage.setItem('tour_index', 0);
                sessionStorage.setItem('tour_history', '');
                tour_history = [];
                tour_index = 0;
            };

        } else {
            tour_history = [];
        }

        app_version = krpano.get('app_version');


    }

    // unloadplugin - exit point for the plugin (optionally)
    local.unloadplugin = function()
    {
        plugin = null;
        krpano = null;
    }

    function tour_home() {
        sessionStorage.removeItem("tour_history");
        sessionStorage.removeItem("tour_index");
        // get scene NUmber of home_tour variable
        // construct URL 
        let a = krpano.get('scene');
        let e = a.getArray().filter((x) => x.tour_home );
        if (e.length > 0) {
            let url = window.location.pathname + "?startscene=" + e[0].name;
            window.location.href = url;
        } else {
            window.location.reload();
        }
    }

    function tour_back() {
        if (tour_index > 0) {
            // krpano.call("stop_but_tween()");
            krpano.call("layer[overlay].hide_overlay()");
            tour_index--;
            krpano.call("find_item_teleport('" + tour_history[tour_index] + "')");
            sessionStorage.setItem('tour_index', tour_index);
        }
    }

    function tour_forward() {
        if (tour_index < tour_history.length-1) {
            // krpano.call("stop_but_tween()");
            krpano.call("layer[overlay].hide_overlay()");
            tour_index++;
            krpano.call("find_item_teleport('" + tour_history[tour_index] + "')");
            sessionStorage.setItem('tour_index', tour_index);
        }
        // console.log("tour forward", tour_index);
    }

    function start_tour(m) {

        let mode = Boolean(m);
        // check if the tour has a start via tour_index
        sessionStorage.setItem("paused", 'no');
        if (tour_index > 0) {
            krpano.call("find_item_teleport('" + tour_history[tour_index] + "')");
        } else {
            //if (mode == "global") {
                krpano.call("find_item_teleport('" + first_stop +  "')");
            //} else {
            //    krpano.call("find_item_teleport_constrain('" + first_stop +  "')");
            //}
        }
        krpano.call("send_accomp('started_tour')");
    }

    function music_on() {
        if (music) {
            krpano.call('tween(sound[bgsnd].volume, .75, 3)');
        }
    }

    function music_off() {
        if (music) {
            krpano.call('tween(sound[bgsnd].volume, 0, 2)');
        }       
    }


    function show_query()
    {
        //
        if (tour_index > 0) {
            music_off();
        }
        // get the data via data attribute (not name)  if needed
        let hs = krpano.get('hotspot[' + current_query_name + '].data');
        if (hs) {
            current_query = krpano.get('data["' + hs + '"]');
        } else {
            current_query = krpano.get('data[' + current_query_name + ']');
        }
        if (current_query) {
            if (current_query.type == 'placard') {
                krpano.call('layer[overlay].show_placard(' + current_query.name + ')');
            }
            if (current_query.type == 'html') {
                krpano.call('layer[overlay].show_html(' + current_query.name + ')');
            }
            if (current_query.type == 'voice') {
                krpano.call('layer[overlay].play_voice(' + current_query.name + ')');
            }
            if (current_query.type == 'video') {
                krpano.call('layer[overlay].show_video(' + current_query.name + ')');
            }
            if (current_query.type == 'quiz') {
                krpano.call('layer[overlay].show_quiz(' + current_query.name + ')');
            }
            if (current_query.type == 'end_tour') {
                krpano.call('layer[overlay].show_end(' + current_query.name + ')');
            }
            if (current_query.type == 'interface') {
                krpano.call('layer[overlay].show_interface(' + current_query.name + ')');
            }
            if (current_query.type == 'passthrough') {
                krpano.call('layer[overlay].passthrough(' + current_query.name + ')');
            }

        }

    } 

    function next_query(t,q) {
        
        krpano.call('stop_but_tween()');
        krpano.call('autorotate.stop()');
        let search_item;
        let next_item;
        if (!q) {
            search_item = sessionStorage.getItem("search_item");
            next_item = krpano.get('hotspot[' + search_item + '].next');
        } else {
            next_item = q;
        }
        let constrain = krpano.get('hotspot[' + current_query_name + '].constrain');
        paused = sessionStorage.getItem("paused");
        if (next_item) {

            // If the timeline is about to change splice it from this point forward
            if (tour_index < tour_history.length-1) {
                if (next_item != tour_history[tour_index+1]) {
                    tour_history.splice(tour_index+1);
                    sessionStorage.setItem("tour_history", (tour_history.join(",") + ","));
                }
            }

            tour_index++;
            sessionStorage.setItem('tour_index', tour_index);
            if (t == "yes") {
                krpano.call('find_item_teleport(' + next_item + ')');
            } else {
                krpano.call('find_item(' + next_item + ',' + constrain + ')');
            }
        }
        //stop the button from tweening
        // krpano.call("stop_but_tween()");
    }

    function set_query(q)
    {
        // sessionStorage.setItem("paused", "no");
        paused = "no";
        krpano.set('layer[pause_tour_control].url', '../' + app_version + '/skin/ak/pause.png');
        // krpano.set('layer[tour_control_bg].bgcolor', '0xFF0000');
        krpano.set('layer[tour_control_bg].style', 'tour_controls_style|play_off');
        krpano.call('layer[overlay].hide_overlay()');



        current_query_name = q;
        // console.log(q);
        //     // get the data via class if needed
        //     let query_data;
        //     let hs = krpano.get('hotspot[' + q + '].data');
        //     console.log(hs);
        //     if (hs) {
        //         query_data = krpano.get('data["' + hs + '"]');
        //     } else {
        //         query_data = krpano.get('data[' + q + ']');
        //     }
        // current_query = query_data;
        sessionStorage.setItem("current_query", q);
        if (tour_history[tour_index] != q) {
            let th = sessionStorage.getItem("tour_history");
            sessionStorage.setItem("tour_history", th += (q + ','));
            tour_history.push(q);
        }
        if (tour_index < tour_history.length-1) {
            krpano.set('layer[tour_ffrew_right].alpha', '1');
            krpano.set('layer[tour_ffrew_right].enabled', 'true');
        } else {
            krpano.set('layer[tour_ffrew_right].alpha', '.3');
            krpano.set('layer[tour_ffrew_right].enabled', 'false');
        }
        music_on();
    }

    function set_pause(p) {
        paused = p;
    }

    function toggle_pause()
    {
        if (paused == "yes") {
            paused = "no";
            sessionStorage.setItem("paused", paused);
            krpano.call('plugin[overlay].play_overlay()');
            //music_on();
        } else {
            paused = "yes";
            sessionStorage.setItem("paused", paused);
            krpano.call('plugin[overlay].pause_overlay()');
            //music_off();
        }
    }


}



