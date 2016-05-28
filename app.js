// helper functions
    // return dom element's top, bottom, left, right, width, height
var isDOM = function isThisADOMElement(dom) { return !!(typeof(dom) == 'object' && typeof(dom.childNodes) == 'object'); };
var getRect = function(dom) { return dom.getBoundingClientRect();};
    // add an eventlistener on dom 
var $on = function on(dom, event, fn) { return dom.addEventListener(event, fn, false); };
var $off = function off(dom, event, fn) { return dom.removeEventListener(event, fn); };
    // create a DOM element
var $dom = function createDOMElement(str) { return document.createElement(str);};
var turn2Array = function TurnIntoArray(o) { return Array.prototype.slice.apply(o);}

// get some necessary dom elements
var viewport = document.querySelector('div');
var ul = viewport.querySelector('ul');
var spanLoading = ul.querySelector('.loading');
var li = turn2Array( ul.querySelectorAll('li') );
var createLIwithContent = function createOneLIelement(content) {
    var li = $dom('li');
    li.innerHTML = content;
    return li;  
};

// timers for better display
var timers = {};

    // temp log messages here
var log = {
    y: 0,
    top: getRect(ul).top,  // get absolute-position ul top
    bottom: getRect(viewport).bottom  // get view port bottom
};
var scrollUL = (function(dom){
    if (!isDOM(dom)) { return false; }
    var target = dom;
    return function( value ) {
        target.style.top = value + 'px';
    };
})(ul); // dom is the element that you want to change dom.style.top

    // dom is the element that contains contents
var REACH_BOTTOM_OFFSET = 20; // 20px
var reachBottom = function ReachBottom(dom) {
    if (!isDOM(dom)) { return false; }  
    return getRect(dom).bottom <= log.bottom - REACH_BOTTOM_OFFSET; // return if contents list touch bottom
};
var reachTop = function ReachBottom(dom) {
    if (!isDOM(dom)) { return false; }  
    return getRect(dom).top > 0; // return if contents list touch bottom
};
    // polyfill: this function will invoked when reach bottom
    // adding delay function to add more joy
var AJAXWORKING = false;
var doAjaxAndAddPages = function (num) {
    if (AJAXWORKING) { return false; } // if AJAX is working, stop invoking.
    
    var tmp = [];
    for (var index = 6; index < (6+num) ; index++) {
        var li = createLIwithContent(new Date());
        tmp.push(li);
    }
    
    AJAXWORKING = true;
    console.log(tmp.length + ' data loaded, will going to add to content');
    timers.AJAX = setTimeout(function() {
        tmp.forEach(function(li) { ul.insertBefore(li, spanLoading); });
        
        AJAXWORKING = false; // false when AJAX is completed
    }, 500);
};


// helper functions to switch desktop vertion to mobile version
var mobileOrDestop = function() {
        // return true for mobile
        return document.ontouchend === null;
    };
var Events = (function(mobile) {
    if (mobile) {
        return {
            start: 'touchstart',
            move:  'touchmove',
            end:   'touchend'
        };
    } else {
        return {
            start: 'mousedown',
            move:  'mousemove',
            end:   'mouseup'
        };
    }
})( mobileOrDestop() );

var getY = (function(mobile) {
    if (mobile) {
        return function(e, end) {
            return end === 'end'? e.changedTouches[0].clientY: e.touches[0].clientY;
        };
    } else {
        return function(e) {
            return e.clientY;
        };
    }
})( mobileOrDestop() );



    // listen on wheel event on ul
ul.onwheel = function(e) {
    e.stopPropagation();
    e.preventDefault();
    
    var value = e.detail === 0? e.deltaY : e.detail;
    if (value > 0) {
        scrollUL( log.top -= 40 );
    } else {
        scrollUL( log.top += 40 );
    }
    
    if ( reachBottom(ul) ) { 
        // load contents from ajax
       doAjaxAndAddPages(5);
    }
    
    // .5s after last scroll, reset page position
    clearTimeout(timers.ONWHEEL);
    timers.ONWHEEL = setTimeout(function(){
        if ( reachTop(ul) ) {
            scrollUL(0);
            log.top = 0;
        }
    }, 500);
}

var mouseMoveListener = function(e) {
    var offsetY = getY(e) - log.y;
    scrollUL( log.top + offsetY );
    
    if ( reachBottom(ul) ) { 
        // load contents from ajax
       doAjaxAndAddPages(5);
    }
};
var mouseUpListener = function(e) {
    var offsetY = getY(e, 'end') - log.y;
    scrollUL( log.top + offsetY );
    
    if ( reachTop(ul) ) {
        scrollUL(0);
        log.top = 0;
    } else {
        log.top += offsetY;
        if ( reachBottom(ul) ) { 
            // load contents from ajax
             doAjaxAndAddPages(5);
        }
    }
    
    // remove listeners
    $off(window, Events.move, mouseMoveListener);
    $off(window, Events.end, mouseUpListener);
};
var mouseDownListener = function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    log.y = getY(e);
    log.top = getRect(ul).top;
    
    $on(window, Events.move, mouseMoveListener);
    $on(window, Events.end, mouseUpListener);
};

$on(ul, Events.start, mouseDownListener);