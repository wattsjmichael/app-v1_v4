/*
    krpano HTML5 Javascript Plugin Example
*/

function krpanoplugin() {
    let local = this;   // save the 'this' pointer from the current plugin object
    let krpano = null;  // the krpano and plugin interface objects
    let plugin = null;
    let floor_map;
    // let tower_id = 1;
    let street_map;
    let current_floor;
    let current_tower;
    let elevation = 0;
    let search_item = null;
    let curr_scene;
    let start_scene;
    let scenes;
    let scene_indexed = {};
    let refreshFlag = false;

    // registerplugin - startup point for the plugin (required)
    local.registerplugin = function (krpanointerface, pluginpath, pluginobject) {

        // TODO pre compile floor scenes from window.path into floor map
        // for fast lookup when looping for whole floors


        // get the krpano interface and the plugin object
        krpano = krpanointerface;
        plugin = pluginobject;
        // add plugin action (the attribute needs to be lowercase!)
        plugin.set_elevations = set_elevations;
        plugin.change_floor = change_floor;
        plugin.get_spawn = get_spawn;
        plugin.floor_menu = floor_menu;
        plugin.tower_menu = tower_menu;
        // plugin.floor_menu_sort = floor_menu_sort;
        plugin.get_path_map = get_path_map;
        // plugin.get_path_map_c = get_path_map_c;
        // plugin.generate_path = generate_path;
        plugin.init_scene = init_scene;
        plugin.init_scene_tour = init_scene_tour;
        plugin.get_path_local = get_path_local;
        plugin.get_path_data = get_path_data;
        plugin.update_floor_map = update_floor_map;
        plugin.update_current_map = update_current_map;
        plugin.registerattribute("curr_floor", current_floor, current_floor_setter, current_floor_getter);
        plugin.registerattribute("curr_tower", current_tower, current_tower_setter, current_tower_getter);
        // plugin.init_accomp = init_accomp;
        plugin.go_home = go_home;
        // plugin.check_stair = check_stair;
        plugin.generate_global_positions = generate_global_positions;
        plugin.registerattribute("current_elev", "current_elev");
        plugin.registerattribute("next_elev", "next_elev");
        try {
            floor_map = JSON.parse(krpano.get('data[floor_map].content'));
            // console.log(floor_map);
            // console.log(current_tower)
        } catch (e) {
            console.log("ERROR", "Error Parsing Scene JSON");
        }


        //PURE HACKERY! MW 5.15.23 TODO Fix the inital null values
        const refreshFlag = sessionStorage.getItem("refreshFlag");
        if (!refreshFlag) {
            // Set the refresh flag to prevent further refreshes
            sessionStorage.setItem("refreshFlag", "true");
            
            // Refresh the page
            location.reload();
          }
        

        // generate the scenes
        generate_path();
        // generate_global_positions();


        current_floor = krpano.get('startfloor');

        current_tower = krpano.get("scene[get(startscene)].tower_id")

        console.log(current_tower, "current tower");
     



        if (current_floor != null) {

            if (floor_map[current_tower][current_floor]) {
                krpano.set('startscene', floor_map[current_tower][current_floor].spawn);
                // console.log("startscene");
                krpano.call('startup()');
            } else {
                let result = krpano.get('scene').getArray();
                if (result) {
                    if (result.length > 0) {
                        current_floor = result[0].floor_id;
                    }
                }
                krpano.set('startscene', 0);
                krpano.call('startup()');
                krpano.set('startfloor', current_floor);
                // krpano.set('starttower', current_tower);
                sessionStorage.setItem('startfloor', current_floor);
                // sessionStorage.setItem('starttower', current_tower);
            }
        } else {
            console.log('null');
            krpano.call('startup()');
            current_floor = krpano.get('startfloor');
            
            // current_tower = krpano.get('starttower');
            // console.log(current_floor, "curflo");
            // console.log(current_tower, "curtow");
        }


        start_scene = krpano.get('scene_name');
        curr_scene = start_scene;
        //get_path_local(start_scene);


        // load the map and change the floor
        change_floor(current_floor, current_tower);
        change_tower(current_floor, current_tower);

        let spawn = floor_map[current_tower][current_floor].spawn;
        console.log(spawn + "Spawn")
        if (start_scene.toLowerCase() == spawn.toLowerCase()) {
            let o = floor_map[current_tower][current_floor];
            krpano.set('view.hlookat', o.angle);
        }

        try {
            street_map = JSON.parse(krpano.get('data[street_map].content'));
            for (var i in street_map) {
                krpano.call('street_sign(' + street_map[i].name + ',' + street_map[i].ath + ')');
            }
        } catch (e) {
            console.log("ERROR", "Error Parsing street JSON");
        }

      
    }

    // unloadplugin - exit point for the plugin (optionally)
    local.unloadplugin = function () {
        trace(1, 'unload check');
        plugin = null;
        krpano = null;
    }

    // function init_accomp() {
    //     console.log("get accomp");
    // }

    function current_floor_setter(newvalue) {
        if (newvalue != current_floor) {
            current_floor = newvalue;
        }
    }

    function current_tower_setter(newvalue) {
        if (newvalue != current_tower) {
            current_tower = newvalue;
        }
    }

    function current_floor_getter() {
        return current_floor;
    }

    function current_tower_getter() {
        return current_tower;
    }

    // function check_stair(id)
    // {
    //     let o = scenes[id].stair;
    //     if (o) {
    //         krpano.call('send_accomp(' + "stair_" + o + ')');
    //     }
    // }

    function go_home() {
        ofloor = sessionStorage.getItem("originatingfloor");
        window.location.href = document.location.origin + document.location.pathname + '?startfloor=' + ofloor;
    }

    // return only the paths on a the current floor (dsnmain)
    function get_path_subset() {

        let o = {};
        let a = scene_indexed[current_floor];
        if (a.length > 0) {
            for (let i = 0; i < a.length; i++) {
                o[a[i]] = scenes[a[i]];
            }
        }
        return o;
    }

    function get_path_data(domain) {
        if (!domain) {
            return scenes;
        } else {
            return get_path_subset();
        }
    }

    function generate_global_positions(cs) {
        let o = scenes;
        let p, tx, tz, ty;
        let l;
        let currentNode;
        let parentNode;
        let endNodes = [];
        let endNode;
        let segments = [];
        let segment;

        for (p in o) {
            l = o[p].children.length;
            if (o[p].parent == null) {
                parentNode = o[p];
                o[p].global_position = [0, 0, 0];
                o[p].local_position = [0, 0, 0];
            }
            if (l == 0) {
                endNodes.push(p);
            }
        }

        function get_next() {
            if (o[currentNode].parent != null) {
                currentNode = o[currentNode].parent;
                return true;
            } else {
                return false;
            }
        }

        // get each segemnt by following back from end
        for (var i = 0; i < endNodes.length; i++) {
            endNode = endNodes[i];
            segment = [];
            segment.push(endNode);
            currentNode = endNode;
            while (get_next()) {
                segment.push(currentNode);
            }
            segments.push(segment.reverse());
        }

        // loop each segment from the begining to add global positions
        for (var i = 0; i < segments.length; i++) {
            let x = segments[i];
            tx = 0;
            tz = 0;
            ty = 0;
            for (var j = 0; j < x.length; j++) {
                let s = o[x[j]];
                tx += s.local_position[0];
                tz += s.local_position[1];
                ty += s.local_position[2];

                s.global_position = [tx, tz, ty];
            }
        }

        krpano.call("set_initial_position(" + o[cs].global_position[0] + "," + o[cs].global_position[1] + "," + o[cs].global_position[2] + ")");
        // window.tour_path = o;
    }

    function get_path_local(cs) {
        let s = cs || curr_scene;
        let path = scenes;
        let current_node;
        let a;
        if (s) {
            current_node = path[s];
            window.current_position = [current_node.global_position[0].toString(), current_node.global_position[1].toString(), current_node.global_position[2].toString()];
        }
        let cp = window.current_position;
        let o, p, tx, tz, ty, c = true;
        let cnc;

        function angle(cx, cy, ex, ey) {
            return Math.round(Math.atan2(ex - cx, ey - cy) * (180 / Math.PI));
        }

        for (o in path) {

            p = path[o];
            c = p.children.length;

            tx = p.global_position[0] -= cp[0];
            tz = p.global_position[1] -= cp[1];
            ty = p.global_position[2] -= cp[2];

        }

        let parent_gp, children_gp;
        if (current_node.parent && !current_node.vparent) {
            parent_gp = path[current_node.parent].global_position;
            a = angle(current_node.global_position[0], current_node.global_position[1], parent_gp[0], parent_gp[1]);
            // krpano.call("make_floorspot(" + parent_gp[0] + "," + parent_gp[1] + "," + parent_gp[2] + "," + current_node.parent + "," + -1 + "," + a + ")");
            krpano.call("make_floorspot(" + parent_gp[0] + "," + parent_gp[1] + "," + parent_gp[2] + "," + current_node.parent + "," + -1 + "," + a + "," + current_node.parent + ")");

        }

        for (var i = 0; i < current_node.children.length; i++) {
            cnc = current_node.children[i];
            children_gp = path[cnc].global_position;
            a = angle(current_node.global_position[0], current_node.global_position[1], children_gp[0], children_gp[1]);
            if (current_node.bridge && path[cnc].bridge) {
                krpano.call("make_vert_nav(" + children_gp[0] + "," + children_gp[1] + "," + children_gp[2] + "," + current_node.children[i] + ")");
            } else {
                krpano.call("make_floorspot(" + children_gp[0] + "," + children_gp[1] + "," + children_gp[2] + "," + current_node.children[i] + "," + path[current_node.children[i]].children.length + "," + a + ")");
            }
        }


    }

    function generate_path() {
        let o = {};
        let c; // the current object
        let name;
        let xmlDoc;
        let stair = false;
        let bridge;

        function get_xml(n) {
            let sa = krpano.scene.getArray()[n];
            xmlDoc = (new DOMParser()).parseFromString('<xml>' + sa.content + '</xml>', "text/xml");
            name = sa.name;
            // stair moved to hotpsot
            //stair = sa.stair;
            bridge = Boolean(sa.bridge);
            window.floor_id = sa.floor_id;
            // console.log(floor_id);
            window.tower_id = sa.tower_id;
            window.current_tower = sa.tower_id;

            // console.log(sa.tower_id);

        }

        //set here but not updated as player has not moved
        window.current_position = null;

        for (var i = 0; i < krpano.scene.count; i++) {

            get_xml(i);
            if (scene_indexed[floor_id]) {
                scene_indexed[floor_id].push(name);
            } else {
                scene_indexed[floor_id] = [];
                scene_indexed[floor_id].push(name);
            }
            console.log(window.current_tower, "wct");
            o[name] = { global_position: null, local_position: null, parent: null, children: [], items: [], vparent: false, stair: stair, bridge: bridge, floor: floor_id, tower: window.current_tower };
            // console.log(o[name])
        }
        for (var i = 0; i < krpano.scene.count; i++) {

            get_xml(i);
            let hotspots = xmlDoc.getElementsByTagName("hotspot") || false;
            let hotspot;
            let child;

            for (var j = 0; j < hotspots.length; j++) {

                let style = hotspots[j].getAttribute("style");

                if (style == "floorspot" || style == "vspot") {
                    hotspot = hotspots[j];
                    child = hotspot.getAttribute("linkedscene").toLowerCase();
                    c = o[child];
                    if (c) {
                        c.parent = name;
                        c.local_position = [Number(hotspot.getAttribute("tx")), Number(hotspot.getAttribute("tz")), Number(hotspot.getAttribute("ty")) || 0];
                        if (style == "floorspot") {
                            o[name].children.push(child);
                        }
                        if (style == "vspot") {
                            c.vparent = true;
                        }
                    } else {
                        throw 'scene node "' + child + '" is not declared in tour.xml';
                    }
                } else {
                    hotspot = hotspots[j];
                    child = hotspot.getAttribute("name");
                    if (hotspot.getAttribute("stair")) {
                        o[name].stair = hotspot.getAttribute("stair");
                    }
                    if (hotspot.getAttribute("exit")) {
                        o[name].exit = hotspot.getAttribute("exit");
                    }
                    if (child != null) {
                        o[name].items.push(child);
                    }
                }

            }

        }

        window.tour_path = o;
        scenes = o;
        // console.log(scene_indexed);
    }


    function get_path_map(n, sf) {

        let path = scenes;
        if (n) {
            // console.log("here")
            window.current_position = [path[n].global_position[0].toString(), path[n].global_position[1].toString(), path[n].global_position[2].toString()];
        }
        let cp = window.current_position;
        let o, p, tx, tz, ty, c = true, items = 0;
        for (o in path) {


            p = path[o];
            c = p.children.length;
            //apply the first offset value here
            tx = p.global_position[0] -= cp[0];
            tz = p.global_position[1] -= cp[1];
            // this is always 0
            //ty = p.global_position[2] -= cp[2];

            if (sf) {

                console.log(floor_map[current_tower][sf]);
                let map = floor_map[current_tower][sf].map; //MIchael's fix
                // offset *2 is because map is currentloy hardcoded at .5
                // last *2 a holdover from the mapping where I mistakingly times scale by 2
                tx = tx += (((map.offset_x * 2) * map.scale) * 2) * -1;
                tz = tz += ((map.offset_y * 2) * map.scale) * 2;

                if (sf == p.floor) {
                    krpano.call("make_mapspot(" + tx + "," + tz + "," + 0 + "," + String(o) + "," + p.items.length + ")");
                }
            } else {
                krpano.call("make_mapspot(" + tx + "," + tz + "," + 0 + "," + String(o) + "," + p.items.length + ")");
            }

        }
    }

    function get_spawn(floor_id) {
        console.log(floor_id);
        //    plugin.is_spawn = Boolean(floor_map[a].elev);
    }



    function init_scene_tour() {
        curr_scene = krpano.get('scene_name');
    }

    function init_scene() {

        // check if its a stair and spin t9o stair nav unles there is a search item to point to
        curr_scene = krpano.get('scene_name');
        let current_floor = krpano.get('startfloor');
        let current_tower = krpano.get('scene').getArray()[0].tower_id;
        scenes[curr_scene].floor = current_floor;
        scenes[curr_scene].tower = current_tower;
        console.log(current_tower, "INIT SCENE")
        // scenes[curr_scene].tower = current_tower;
        let search_item = sessionStorage.getItem("search_item");
        let auto_nav = sessionStorage.getItem("auto_nav");
        let stairwell = "stairwell";
        let exit_floor = "exit_floor";

        // console.log(scenes);
        scenes[curr_scene].items.forEach((x) => {
            let o = krpano.get('layer["' + x + '"]');
            if (o) {
                o.alpha = 1;
                o.enabled = true;
            }
        });

        if (search_item != 'null') {
            // krpano.call('looktohotspot(' + search_item + ',get(shoosh_fov),smooth(),true)');
            sessionStorage.setItem("search_item", null);
        } else {
            let o = scenes[curr_scene].stair;
            if (o) {
                krpano.call('send_accomp("' + 'stair_' + o + '")');
                // get the stairwell hotspot
                // let exit_check = krpano.get('hotspot[exit_button]');
                if (search_item != 'exit_floor') {
                    krpano.call('looktohotspot(' + stairwell + ',get(shoosh_fov),tween(easeoutquart,.5),true)');
                } else {
                    krpano.call('looktohotspot(' + exit_floor + ',get(shoosh_fov),tween(easeoutquart,.5),true)');
                }

            }
        }

        if (scenes[curr_scene].stair) {
            krpano.call('set(layer[stair_vids].visible, true); set(layer[floor_vids].visible, false);');
        } else {
            krpano.call('set(layer[stair_vids].visible, false); set(layer[floor_vids].visible, true);');
        }
        
    }

    function set_elevations(a, b) {
        // console.log(scenes[b], "scenes")
        console.log(a, "A");
        //NEXT SCENE COULD BE IN A DIFFERENT TOUR! FIX IT!!
        plugin.current_elev = Number(floor_map[current_tower][a].elev);
        plugin.next_elev = Number(floor_map[current_tower][b].elev);
        //IF CURRENT_TOWER DOESNT EQUAL CURRENT TOWER
    }

    // function change_floor(floor_id, tower_id) {
    //     console.log("change_floor called with floor_id = ", floor_id, "and tower_id = ", tower_id);
    //     console.log("floor_map = ", floor_map);

    //     let o = floor_map[floor_id];
    //     console.log(o + " TYO");

    //     if (o.elev !== undefined) {
    //         plugin.current_elev = Number(o.floor_map[floor_id][tower_id].elev);
    //       } else {
    //         console.log(`Elevation information not found for floor ${floor_id} and tower ${tower_id}`);
    //       }
    //     plugin.current_elev = Number(o.elev);
    //     krpano.call('load_map("' + o.map.name + '","' + o.map.scale + '")');
    //     krpano.set('layer[floor_text].html', "Floor " + floor_id);
    //     krpano.set('layer[tower_text].html', "Tower " + tower_id);
    //     console.log(tower_id);
    //     current_floor = floor_id;
    //     current_tower = tower_id;
    //     krpano.call('offset_radar(' + o.map.offset_x + ',' + o.map.offset_y + ',' + o.map.mm_scale + ',' + o.map.scale + ')');
    //   }

    function change_floor(floor_id) {
        // or 2, depending on the tower you want to access
        console.log(current_tower, "tid");
        console.log(floor_id);
        let o = floor_map[current_tower][floor_id];
        // console.log(" tower_id ", floor_map[tower_id][floor_id]);
        plugin.current_elev = Number(o.elev);
        krpano.call('load_map("' + o.map.name + '","' + o.map.scale + '")');
        krpano.set('layer[floor_text].html', "Floor " + floor_id);
        current_floor = floor_id;
        // current_tower = tower_id;
        krpano.call('offset_radar(' + o.map.offset_x + ',' + o.map.offset_y + ',' + o.map.mm_scale + ',' + o.map.scale + ')');
    }

    function change_tower(floor_id) {
        // or 2, depending on the tower you want to access
        console.log(current_tower, "tid");
        console.log(floor_id);
        let o = floor_map[current_tower][floor_id];
        // console.log(" tower_id ", floor_map[tower_id][floor_id]);
        plugin.current_elev = Number(o.elev);
        krpano.call('load_map("' + o.map.name + '","' + o.map.scale + '")'); 
        krpano.set('layer[tower_text].html', "Tower " + current_tower);
        current_floor = floor_id;
        // current_tower = tower_id;
        krpano.call('offset_radar(' + o.map.offset_x + ',' + o.map.offset_y + ',' + o.map.mm_scale + ',' + o.map.scale + ')');
    }

    function update_floor_map(cs) {
        let floor = scenes[cs].floor;
        if (floor != current_floor) {
            generate_path();
            generate_global_positions(cs);
            krpano.call('make_sym_links()');
            change_floor(floor);
        }
    }
    function update_current_map(cs) {
        let floor = scenes[cs].floor;
        generate_path();
        generate_global_positions(cs);
        krpano.call('make_sym_links()');
        change_floor(floor);
    }

    // function floor_menu() {
    //     let html = '';
    //     let a = [];
    //     for (var o in floor_map) {
    //         a.unshift('<div class="floor_link" href="' + document.location.origin + document.location.pathname + '?startfloor=' + o + '">' + o + '</div>');
    //     }
    //     html = a.join("");
    //     krpano.call('layer[overlay].show_floor_menu(' + html + ')');
    // }



    //APP V1_4 Function 
    function floor_menu() {
        let html = '';
        let a = [];

        if (floor_map.hasOwnProperty(current_tower)) {
            const currentTower = floor_map[current_tower];
            for (var floor_id in currentTower) {
                console.log(floor_id); // Log the floor_id
                console.log(current_tower); // Log the current_tower

                if (currentTower[floor_id].sort !== undefined) {
                    a.push('<div class="floor_link" href="' + document.location.origin + document.location.pathname + '?startscene=' + currentTower[floor_id].spawn + '">' + floor_id + '</div>');
                } else {
                    a.unshift('<div class="floor_link" href="' + document.location.origin + document.location.pathname + '?startscene=' + currentTower[floor_id].spawn + '">' + floor_id + '</div>');
                }
            }
        }

        html = a.join("");
        krpano.call('layer[overlay].show_floor_menu(' + html + ')');
    }

    function getSceneNameBySpawn(tower_id, floor_id) {
        if (floor_map.hasOwnProperty(tower_id) && floor_map[tower_id].hasOwnProperty(floor_id)) {
            return floor_map[tower_id][floor_id].spawn;
        }
        return null; // Return null if the spawn label is not found
    }
    // function floor_menu() {
    //     let html = '';
    //     let a = [];

    //     for (var floor in floor_map) {
    //         if (floor_map.hasOwnProperty(floor)) {
    //             var towers = floor_map[floor];

    //             for (var tower in towers) {
    //                 if (towers.hasOwnProperty(tower)) {
    //                     var towerObj = towers[tower];
    //                     console.log(towerObj);

    //                     if (towerObj.sort) {
    //                         a[towerObj.sort] = '<div class="floor_link" href="' + document.location.origin + document.location.pathname + '?startfloor=' + floor + '&starttower=' + tower + '">' + floor + '-' + tower + '</div>';
    //                     } else {
    //                         a.unshift('<div class="floor_link" href="' + document.location.origin + document.location.pathname + '?startfloor=' + floor + '&starttower=' + tower + '">' + floor + '-' + tower + '</div>');
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     html = a.join("");
    //     krpano.call('layer[overlay].show_floor_menu(' + html + ')');
    // }

    function tower_menu() {
        let html = '';
        let a = [];

        for (var tower_id in floor_map) {
            if (floor_map.hasOwnProperty(tower_id)) {
                const tower = floor_map[tower_id];
                for (var floor_id in tower) {
                    if (tower.hasOwnProperty(floor_id)) {
                        const floor = tower[floor_id];
                        if (floor.hasOwnProperty("tower_spawn")) {
                            a.push('<div class="floor_link" href="' + document.location.origin + document.location.pathname + '?tower=' + tower_id + '&startscene=' + floor.tower_spawn + '">' + tower_id + '</div>');
                            break; // Exit the inner loop after finding the tower_spawn property
                        }
                    }
                }
            }
        }

        html = a.join("");
        krpano.call('layer[overlay].show_tower_menu(' + html + ')');
    }







}

