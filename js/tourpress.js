/*

    URL vars 
    start_floor : specify the fkloor to start, if not provided will start at the building spawn point (most likely the lobby of top floor)
    startscene  : specify the Pano ID you wish to load
    mode        : 'tour' oe 'explore' Default is explore


*/
const ismobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const startfloor = getUrlParam('startfloor', null);
const mode = getUrlParam('mode', false);
const tour = getUrlParam('tour', false);
const originating_floor = getUrlParam('originatingfloor', false);
let tenant = getUrlParam('t', false);

if (!sessionStorage.getItem("mode")) {
    sessionStorage.setItem("mode", mode || 'explore');
}

if (!sessionStorage.getItem("startfloor")) {
    sessionStorage.setItem("startfloor", null);
}

if (!sessionStorage.getItem("originatingfloor")) {
    sessionStorage.setItem("originatingfloor", null);
}

if (originating_floor) {
    sessionStorage.setItem("originatingfloor", originating_floor);
}
if (startfloor) {
    sessionStorage.setItem("startfloor", startfloor);
}

if (mode) {
    sessionStorage.setItem("mode", mode);
}

sessionStorage.setItem("search_item", null);

if (!sessionStorage.getItem("tour_history")) {
    sessionStorage.setItem("tour_history", "");
}

if (!sessionStorage.getItem("welcome")) {
    sessionStorage.setItem("welcome", "no");
}

if (!sessionStorage.getItem("auto_nav")) {
    sessionStorage.setItem("auto_nav", "on");
}

if (!sessionStorage.getItem("current_query")) {
    sessionStorage.setItem("current_query", null);
}
if (!sessionStorage.getItem("paused")) {
    sessionStorage.setItem("paused", "no");
}
if (!sessionStorage.getItem("tour")) {
    sessionStorage.setItem("tour", tour || 'default');

}
if (!sessionStorage.getItem("accomp")) {
    sessionStorage.setItem("accomp", "");

}
if (tour) {
    sessionStorage.setItem("tour", tour);
}

if(tenant) {
    sessionStorage.setItem("tenant", tenant);
} else {
    if (sessionStorage.getItem("tenant")) {
        tenant = sessionStorage.getItem("tenant");
    }
}

if (!sessionStorage.getItem("timer")) {
    sessionStorage.setItem("timer", new Date().getTime());
}

// let timer = new Date();
// console.log("hello");
let timer;

function msToTime(s) {

    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
  
    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
  }

setInterval(function() {
    // console.log(new Date().getTime());
    // console.log(new Date().getTime() - Number(sessionStorage.getItem("timer")))
    timer = new Date().getTime() - Number(sessionStorage.getItem("timer"));

    // console.log(msToTime(timer)); 
    // console.log(timer);
},250)

//I Need to do Ipad test here and probably ios then pass it is a var
function isIpadOS() {
	return navigator.maxTouchPoints &&
	  navigator.maxTouchPoints > 2 &&
	  /MacIntel/.test(navigator.platform);
}

function isiOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }
// krpano.set('global.ios', isIpadOS() || krpano.get('device.ios'));
// alert(krpano.get('ios'));

function ochange() {
    krpano.call('resize_components()');

}

  
window.addEventListener('orientationchange', ochange);
// console.log(tenant);
embedpano({
   
    xml: (tenant) ? tenant + ".xml" : "default.xml",
    initvars: {
        maps:'./maps/',
        skin: 'ak',
        app_version: 'app-v1_4_ipc',
        startfloor: startfloor,
        ios: isIpadOS() || isiOS(),
        mode: sessionStorage.getItem("mode"),
        tour: sessionStorage.getItem("tour"),
        nav3d: localStorage.getItem("nav3d"),
        debug: localStorage.getItem("debug")
    },
    target: "pano",
    html5: "only",
    mobilescale: 1.0,
    ismobile: ismobile,
    passQueryParameters: true,
    consolelog: true
});
var krpano = document.getElementById("krpanoSWFObject");


let tp = window.tourpress = {};
tp.angle = function (cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var a = Math.atan2(dx, dy);
    a = a * (180 / Math.PI);
    return Math.round(a);
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
} // var mytext = getUrlVars()["text"];

function getUrlParam(parameter, defaultvalue) {
    var urlparameter = defaultvalue;
    if (window.location.href.indexOf(parameter) > -1) {
        urlparameter = getUrlVars()[parameter];
    }
    return urlparameter;
} //var mytext = getUrlParam('game','null');


// Accomplishemnts API
// let accomploStrings = {
//     drill_video: "drill_video",
//     n_stair: "n_stair",
//     s_stair: "s_stair",
//     stair_1: "stair_1",
//     stair_2: "stair_2",
//     stair_3: "stair_3",
//     stair_4: "stair_4",
//     stair_5: "stair_5",
//     stair_6: "stair_6",
//     assembly_area: "assembly_area",
//     ext_use: "extinguisher_use",
//     relo_floor: "relo_floor",
//     started_tour: "started_tour",
//     completed_tour: "completed_tour",
//     defib: "defib"
// };

function sendAccomp(n) {

    // console.log(window.accomploStrings[n]);
    try {
        let buildingCode = location.pathname.split("/")[2];   // = “ric”
        let userStr = localStorage[buildingCode + '_user'];

        let userObj = JSON.parse(userStr);
        let userId = userObj.userId;
        let accomplishmentName = window.accomploStrings[n]; //'extinguisher_video_on_floor12_complete'


        if (accomplishmentName) {
            fetch('/api2/accomplishment/' + userId + '/' + accomplishmentName)
                .catch(err => console.warn('Oops, there was an error' + err));
            // .then(result => console.log('Wrote Accomplishment successfully'))
        }
    } catch (error) {
        //if (window.accomploStrings[n]) {
            console.log("Accomplishment to send: " + window.accomploStrings[n]);
        //}
    }
}

//MICHAEL CODE 6/30/22
// function sendInventory(n) {

//     console.log(window.inventoryStrings[n]);
//     try {
//         let buildingCode = location.pathname.split("/")[2];   // = “ric”
//         let userStr = localStorage[buildingCode + '_user'];

//         let userObj = JSON.parse(userStr);
//         let userId = userObj.userId;
//         let inventoryName = window.inventoryStrings[n]; //'extinguisher_video_on_floor12_complete'


//         if (inventoryName) {
//             fetch('/api2/inventory/' + userId + '/' + inventoryName)
//                 .catch(err => console.warn('Oops, there was an error' + err));
//             // .then(result => console.log('Wrote inventory successfully'))
//         }
//     } catch (error) {
//         //if (window.inventoryStrings[n]) {
//             console.log("inventory to send: " + window.inventoryStrings[n]);
//         //}
//     }
// }

 
// Preload images
function preloadImage(url) {
    var img = new Image();
    img.src = url;
}



/*!
 * amp-playlists - Playlists for Azure Media Player
 * v0.1.0
 * 
 * copyright Antonio Laguna, Ori Ziv 2017
 * MIT License
*/
/*!
 * amp-playlists - Playlists done right for Videojs
 * v0.2.0
 * 
 * copyright Antonio Laguna, Ori Ziv 2016
 * MIT License
*/
/**
**************************************************** 
********************* EXAMPLE **********************
****************************************************
**/

// In order to initialize playList you need to pass an array of videos with this structure:
/*
var videos = [
 {
   src : [
     'http://amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest'
   ],
   poster : '',      // Optional
   title : 'Title1', // Optional
   timeRange:{       // Optional
     start : 0,
     end : 432
   },
   token : "bearer eTRsdfsdf12124...." //Optional
 },
 {
   src : [
   'http://amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest'
   ],
   poster : 'http://www.videojs.com/img/poster.jpg',
   title : 'Ocean'
 }
];
player.playlist(videos);
*/
// AMP playlist plugin

(function () {
    // Register AMP Plugin
    amp.plugin('playlist', playList);

    //videojs-playlists.js
    function playList(options, arg) {
        var player = this;
        player.pl = player.pl || {};
        var index = parseInt(options, 10);

        player.pl._guessVideoType = function (video) {
            var videoTypes = {
                'webm': 'video/webm',
                'mp4': 'video/mp4',
                'ogv': 'video/ogg',
                'ism/manifest': 'application/vnd.ms-sstr+xml'
            };

            if (!video || !video.split) {
                return videoTypes.mp4;
            }
            var extension = video.split('.').pop();
            return videoTypes[extension] || '';
        };

        // Init playlist object
        player.pl.init = function (videos, options) {
            options = options || {};
            player.pl.videos = [];
            player.pl.current = 0;
            player.on('ended', player.pl._videoEnd);

            if (options.getVideoSource) {
                player.pl.getVideoSource = options.getVideoSource;
            }

            player.pl._addVideos(videos);
        };

        // Update playlist item poster (usefull between sources)
        player.pl._updatePoster = function (posterURL) {
            player.poster(posterURL);
            player.removeChild(player.posterImage);
            player.posterImage = player.addChild("posterImage");
        };

        // Add playlist items to player.pl
        player.pl._addVideos = function (videos) {
            for (var i = 0, length = videos.length; i < length; i++) {
                var aux = [];
                for (var j = 0, len = videos[i].src.length; j < len; j++) {
                    var newSource = {
                        type: player.pl._guessVideoType(videos[i].src[j]),
                        src: videos[i].src[j]
                    };

                    // In case of Safari, we change the way the video is displayed
                    if (amp.IS_SAFARI) {
                        newSource.disableUrlRewriter = true;
                        newSource.type = "application/vnd.apple.mpegurl";
                    }
                    // Add playlist item token if exists
                    else if (videos[i].token) {
                        newSource.protectionInfo = [{
                            type: videos[i].tokenType || "AES",
                            authenticationToken: videos[i].token
                        }];
                    }

                    aux.push(newSource);
                }
                videos[i].src = aux;
                player.pl.videos.push(videos[i]);
            }
        };

        // Trigger next/prev events
        player.pl._nextPrev = function (func) {
            var comparison, addendum;

            if (func === 'next') {
                comparison = player.pl.videos.length - 1;
                addendum = 1;
            }
            else {
                comparison = 0;
                addendum = -1;
            }

            if (player.pl.current !== comparison) {
                var newIndex = player.pl.current + addendum;
                player.pl._setVideo(newIndex);
                player.trigger(func, [player.pl.videos[newIndex]]);
            }
        };

        player.pl._stopPlaylist = function () {
            player.pl._setVideo(0);
            player.pause();
            player.trigger('stop');
        };

        // Set item source
        player.pl._setVideo = function (index) {
            var currentPlayingSource = player.currentSrc();
            var startPoint = 0;
            if (index < player.pl.videos.length) {
                player.pl.current = index;
                player.pl.currentVideo = player.pl.videos[index];

                if (!player.paused()) {
                    player.pl._resumeVideo();
                }

                // If the current item has the same source like the prev one
                // We just need to 'jump' and set the current time.
                if (currentPlayingSource && currentPlayingSource.indexOf(player.pl.currentVideo.src[0].src) !== -1) {
                    try {
                        // Set start opint by item timeRange.start
                        if (player.pl.currentVideo.timeRange) {
                            startPoint = player.pl.currentVideo.timeRange.start;
                        }


                        if (amp.IS_SAFARI) {
                            player.currentTime(startPoint);
                        }
                        else {
                            setTimeout(function () {
                                player.currentTime(startPoint);
                            });
                        }


                    } catch (e) { }

                    if (player.paused()) {
                        if (amp.IS_SAFARI) {
                            player.play();
                        }
                        else {
                            // Make sure it runs on other event loop (due to chromium bug)
                            setTimeout(function () {
                                player.play();
                            }, 0);
                        }
                    }
                    return;
                }

                // Other source
                if (player.pl.getVideoSource) {
                    player.pl.getVideoSource(player.pl.videos[index], function (src, poster) {
                        player.pl._setVideoSource(src, poster);
                    });
                } else {
                    player.pl._setVideoSource(player.pl.videos[index].src, player.pl.videos[index].poster, player.pl.videos[index].tracks);
                }
            }
        };

        player.pl._setVideoSource = function (src, poster, tracks) {
            if (tracks && tracks.length) {
                player.src(src, tracks);
            } else {
                player.src(src);
            }
            player.pl._updatePoster(poster);
        };

        // Resume play
        player.pl._resumeVideo = function () {
            player.one('loadstart', function () {
                if (amp.IS_SAFARI) {
                    player.play();
                }
                else {
                    setTimeout(function () {
                        player.play();
                    }, 0);
                }
            });
        };

        // Trigger event when video ends
        player.pl._videoEnd = function () {
            if (player.pl.current === player.pl.videos.length - 1) {
                player.trigger('lastVideoEnded');

            }
            else {
                player.pl._resumeVideo();
                player.next();
            }
        };

        if (options instanceof Array) {
            player.pl.init(options, arg);
            player.pl._setVideo(0);
            return player;
        }
        else if (index === index) { // NaN
            player.pl._setVideo(index);
            player.trigger("indexChanged");
            return player;
        }
        else if (typeof options === 'string' && typeof player.pl[options] !== 'undefined') {
            player.pl[options].apply(player);
            return player;
        }
    }

    amp.Player.prototype.next = function () {
        this.pl._nextPrev('next');
        return this;
    };
    amp.Player.prototype.prev = function () {
        this.pl._nextPrev('prev');
        return this;
    };
    amp.Player.prototype.stop = function () {
        this.pl._stopPlaylist();
        return this;
    };

}).call(this);




