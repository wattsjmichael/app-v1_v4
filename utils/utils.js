/*

    Generate Floors -- Stairs

*/
function VTour2() {

    function log(t1, t2) {
        if (t2) {
            console.log(t1,t2);
        } else {
            console.log(t1);

        }
    }


    function generate_guided_tour(id, csv) 
    {

        fetch(csv)
        .then(function(response) {
            return response.text();
        })
        .then(function(data) {
            //make_jump_list(make_stairwell_data(data,l));
            log(data,l);
        });


        // let ta = s.split("\r\n");
        // let a = [];
        // let row;
        // let max = 300; // max number allowed

        // log(ta);

        // ta.shift();
        // ta.forEach(function (o, i) {
        //     if (i < max) {
        //         row = o.split(",");
        //         a[i] = {num:row[0],name:row[1],url:String(row[2]) || null};
        //     }

        // });

        // log(a)

    }




    function make_stairwell_data(s, l) {
        
        let ta = s.split("\r\n");
        let a = [];
        let row;
        let max = l || 300; // max number allowed

        ta.shift();
        ta.forEach(function (o, i) {
            if (i < max) {
                row = o.split(",");
                a[i] = {num:row[0],name:row[1],url:String(row[2]) || null};
            }

        });


        return a;
        // return s.split("\r");

    }

    function make_stair_xml(o, s, pa, l,c,ath) {

        let stairwell = s;
        let scene;
        let scenes = '<!-- Generated Scenes -->\r\n';
        let scene_name;
        let preAlign = pa || 0;
        let floorheight = 500;
        let cap = c || NULL;
        let uph = -111;
        let dnh = -76;
        //log("Data for stairwell "+s,o);

        function get_stair_name(n) {
            return 'STAIR_' + s + '_' + n;
        }

        function get_next_stair_name(n) {
            return 'STAIR_' + s + '_' + (n+1);
        }

        function get_pre_stair_name(n) {
            return 'STAIR_' + s + '_' + (n-1);
        }

        o.forEach(function(stair, i) {
            //log("Row "+i,stair);

            scene = '';
            scene_name = get_stair_name(i);
            next_scene_name = get_next_stair_name(i);
            pre_scene_name = get_pre_stair_name(i);
            //floorheight += 500

            scene += '<scene name="' + scene_name + '" title="floor ' + stair.num + ' - ' + stair.name + '">\r\n';

            scene += '\t<preview url="panos/stair_copy.tiles/preview.jpg" />\r\n';
            // f and r labels for stairs 1 and 2
            scene += '\t<image prealign="0|' + preAlign + '|0" cubelabels="l|f|r|b|u|d">\n';
            scene += '\t\t<cube url="panos/stair_copy.tiles/pano_%s.jpg" />\n';
            scene += '\t\t<!-- <depthmap url="../../content/stl/default_stl.stl" style="depthmapsettings" /> -->\n';
            scene += '\t</image>\r\n';
                
            if (i < l-1) {
                scene += '\t<hotspot name="' + next_scene_name + '" style="floorspot" linkedscene="' + next_scene_name + '" tx="0" tz="0" ty="' + floorheight + '" />\n';                
            } else {
                scene += '\t<hotspot name="' + cap + '" style="floorspot" linkedscene="' + cap + '" tx="0" tz="0" ty="' + floorheight + '" />\n';
            }

            if (i > 0) {
                scene += '\t<hotspot style="nav_url|arrow_up" linkedscene="' + pre_scene_name + '" ath="' + uph + '" />\n';                
            }
            
            if (i < l-1) {
                scene += '\t<hotspot style="nav_url|arrow_down" linkedscene="' + next_scene_name + '" ath="' + dnh + '" />\n';
            } else {
                scene += '\t<hotspot style="nav_url|arrow_down" linkedscene="' + cap + '" ath="' + dnh + '" />\n';
            }

            if (stair.url) {
                scene += '\t<hotspot style="nav_url|door_style" onclick="make_url(../../' + stair.url + 'floor_' + stair.num + '/?startscene=STAIR_' + s + ');" ath="' + ath + '" />';
            }

            scene += '</scene>\r\n\r\n';
            
            scenes += scene;

        });

        scenes += '<!-- End Generated Scenes -->';
       console.log(scenes);

    }

    function generate_stair_xml(l,s, pa, cap, ath) {

        fetch('../../app/data/stair_list.csv')
        .then(function(response) {
            return response.text();
        })
        .then(function(data) {
            make_stair_xml(make_stairwell_data(data,l), s, pa, l, cap, ath);
        });
    }

    function make_jump_list(o) {

        let t = '<b>Jump to floor:</b><br/><br/><span style="color:#999999;">';
        let num;
        // 25 24 23 22 21<br>
		// 20 19 18 17 16<br>
		// <a href="../floor_15/?startscene=0"> 15 </a> 14 13 12 11<br>
		// <a href="../floor_10/?startscene=0"> 10 </a> 09 08 07 06<br>
        // 05 04 03 <a href="../floor_2/?startscene=0"> 02 </a> 01
        
        o.forEach(function(floor,i) {
            if (i%8 == 0) {
                t += '<br>';
            }
            if (floor.num < 10) {
                num = "0" + floor.num;
            } else {
                num = floor.num;
            }
            if(floor.url) {
                num = '<a href="../../' + floor.url + 'floor_' + floor.num + '" >' + num + '</a>';
            }
            t += (num + " "); 
        });

        t += '<br><br></span>';

        log(t);
    }

    function generate_jump_list(l) {

        fetch('../../app/data/stair_list.csv')
        .then(function(response) {
            return response.text();
        })
        .then(function(data) {
            make_jump_list(make_stairwell_data(data,l));
        });
    }


    return {
        generate_stair_xml:generate_stair_xml,
        generate_jump_list:generate_jump_list,
        generate_guided_tour:generate_guided_tour
    }


}

window.vt2 = new VTour2(); 
