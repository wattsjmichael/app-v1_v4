/*

    Generate XML for tour
    Drag and drop folders to window

*/
console.log("TOUR XML GENERATOR");

let dropzone = document.getElementById("dropzone");
let listing = document.getElementById("listing");
let txt = '';

function scanFiles(item, item2,n) {

  let name = item.name.split(".")[0];
  let next = false;
  if (item2)
  next = item2.name.split(".")[0];

  txt += "\r\n";

  //txt += '<scene id="' + (n+1) + '" name="' + name + '">';
  txt += '<scene name="' + name + '" floor_id="" >';
  txt += "\r\n";
  txt += '<preview url="panos/' + name + '.tiles/preview.jpg" />';
  txt += "\r\n";
  txt += '<image prealign="0|0|0">';
  txt += "\r\n";
  txt += '<cube url="panos/' + name + '.tiles/pano_%s.jpg" />';
  txt += "\r\n";
  //txt += '<!-- <depthmap url="../../content/stl/default_stl.stl" style="depthmapsettings" /> -->';
  //txt += "\r\n";
  txt += '</image>';
  txt += "\r\n";
  if (next) {
    txt += '<hotspot name="' + next+ '" style="floorspot" linkedscene="' + next + '" tx="0" tz="0" />';
    txt += "\r\n";  
  }
  txt += '</scene>';
  txt += "\r\n\r\n";

}

dropzone.addEventListener("dragover", function(event) {
    event.preventDefault();
}, false);

dropzone.addEventListener("drop", function(event) {
    let items = event.dataTransfer.items;
    let item2 = false;
    event.preventDefault();
    //listing.innerHTML


    txt = '<krpano floor_height="160" floor_id="0" layout_map_url="../../app/minimap/default_map_grid.png" layout_map_scale="1.0">';
    txt += "\r\n";
    txt += "\r\n";
    txt += '<include url="../../app/app.xml" />';
    txt += "\r\n";
    txt += "\r\n";
    txt += '<!-- MINIMAP -->';
    txt += "\r\n";
    txt += '<layer name="minimap_container" style="minimap_container_style">';
    txt += "\r\n";
		txt += '<layer name="minimap_clipped" style="minimap_clipped_style" url="../../app/minimap/default_map_grid.png" scale=".32" />';
    txt += "\r\n";
		txt += '<layer name="mini_map_spot" style="mapspot" />';
    txt += "\r\n";
	  txt += "</layer>";
    txt += "\r\n";
    txt += '<layer name="bigmap_container" style="bigmap_container_style">';
    txt += "\r\n";
    txt += '<layer name="bigmap" style="bigmap_style" url="../../app/minimap/default_map.png" />';
    txt += "\r\n";
		txt += '<layer name="big_map_spot" style="mapspot" scale=".4" />';
    txt += "\r\n";
	  txt += "</layer>";
    txt += "\r\n";
    txt += "\r\n";


    txt += '<!-- INIT -->';
    txt += "\r\n";
    txt += '<action name="local_init" scope="local" autorun="onstart">';
    txt += "\r\n";
		txt += 'update_floor("Floor __");';
    txt += "\r\n";
    txt += 'offset_radar(0,0,0,0);'
    txt += "\r\n";
		txt += '<!-- make_symbolic_link("GS__0001","GS__0002"); -->';
    txt += "\r\n";
    txt += '</action>';
    txt += "\r\n";
    txt += "\r\n";
    txt += '<!-- TOUR 1 -->';
    txt += "\r\n";
    txt += '<data tour_id="1" linkedscene="'+ items[0].webkitGetAsEntry().name.split(".")[0] +'" ath="0" angle="" onclick="next_tour_scene();" post=" Click next to continue."><![CDATA[';
    txt += "\r\n";
    txt += 'Tour text here!';
    txt += "\r\n";
    txt += ']]></data>';
    txt += "\r\n";
    txt += "\r\n";
    txt += '<!-- SCENES -->';
    

    for (let i=0; i<items.length; i++) {
      item2 = false;
      let item = items[i].webkitGetAsEntry();
      if (items[1+i])
      item2 = items[1+i].webkitGetAsEntry();
      
      scanFiles(item,item2,i);
      
    }
    txt += "</krpano>";
    listing.innerText = txt;

  }, false);


function updateSize() {
    let nBytes = 0,
        oFiles = this.files,
        nFiles = oFiles.length;
    for (let nFileId = 0; nFileId < nFiles; nFileId++) {
      nBytes += oFiles[nFileId].size;
    }
    let sOutput = nBytes + " bytes";
    // optional code for multiples approximation
    const aMultiples = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    for (nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
      sOutput = nApprox.toFixed(3) + " " + aMultiples[nMultiple] + " (" + nBytes + " bytes)";
    }
    // end of optional code
    document.getElementById("fileNum").innerHTML = nFiles;
    document.getElementById("fileSize").innerHTML = sOutput;
  }

  document.getElementById("uploadInput").addEventListener("change", updateSize, false);

