//Called when application is started.
function OnStart()
{
  	//Create a layout with objects vertically centered.
  	var lay = app.CreateLayout( "linear", "VCenter,FillXY" );	

    var web = app.CreateWebView( 1, 0.9 );
  	loadHtmlWrapper(web);
  	lay.AddChild( web );
    app.AddLayout( lay );
}

function loadHtmlWrapper( webview )
{
  	var html = "<html><head>";
  	html += "<meta name='viewport' content='width=device-width'>";
  	html += "</head><body>";
  	html += "<script src='d3.min.js'></script>";
  	html += "<script src='D3test.js'></script>";
  	html += "<script>document.addEventListener('DOMContentLoaded', OnReady)</script>";
  	html += "<div id='vis'></div></body></html>";
  	webview.LoadHtml( html );
}

// wrapper for data
var BHIMAGEDATA = (function()
{
    var public = {};
    var m_dataWidth = 36;
    var m_dataHeight = 240;
    var m_depthData = [];
    var m_imageData = [];
    
    public.initialize = function()
    {
        var lastDepth = 100;
        for ( var i = 0; i < m_dataHeight; i++ )
        {
            for ( var j = 0; j < m_dataWidth; j++ )
            {
                m_imageData.push( Math.random() );
            }
            m_depthData.push( lastDepth );
            lastDepth += 1 + Math.random();
        }
    }
    
    public.dataWidth = function()
    {
        return m_dataWidth;
    }
    public.dataHeight = function()
    {
        return m_dataHeight;
    }
    public.imageValue = function( r, c )
    {
        return m_imageData[ r*m_dataWidth + c ];
    }
    public.depthValue = function( r )
    {
        return m_depthData[ r ];
    }
    
    return public;
}());


var m_context;
var m_topDepth;
var m_bottomDepth;

function canvasWidth()
{
    return window.innerWidth - 16;
}

function canvasHeight()
{
    return window.innerHeight - 16;
}

function OnReady( )
{
    var base = d3.select("#vis");
    var chart = base.append("canvas")
        .attr("width", canvasWidth() )
        .attr("height", canvasHeight() );
    m_context = chart.node().getContext("2d");
    
    var el = document.getElementsByTagName("canvas")[0];
    el.addEventListener("touchstart", handleStart, false);
    el.addEventListener("touchend", handleEnd, false);
    el.addEventListener("touchcancel", handleCancel, false);
    el.addEventListener("touchmove", handleMove, false);
    
    m_topDepth = 150;
    m_bottomDepth = 170;
    
    BHIMAGEDATA.initialize();
    
    console.log( 'data loaded' );
    
    drawVisible(
        canvasWidth(), canvasHeight(),
        m_context, 
        m_topDepth, m_bottomDepth );
}

function adjustTopBottomView( deltaY0, deltaY1, diff01 )
{
    var depthRange = m_bottomDepth - m_topDepth;
    var pixelToDepth = depthRange / canvasHeight();
    var depthOffset0 = pixelToDepth * deltaY0;
    var depthOffset1 = pixelToDepth * deltaY1;
    m_topDepth -= diff01 > 0 ? depthOffset0 : depthOffset1;
    m_bottomDepth -= diff01 > 0 ? depthOffset1 : depthOffset0;
}

function drawVisible(
    viewWidth, viewHeight,
    context,
    startDepth, endDepth )
{
    var dataWidth = BHIMAGEDATA.dataWidth();
    var dataHeight = BHIMAGEDATA.dataHeight();
    
    var azimuthScale = d3.scaleLinear()
        .range([0, viewWidth]) // range of output
        .interpolate(d3.interpolateRound)
        .domain([0, dataWidth]); // range of input
        
    var depthScale = d3.scaleLinear()
        .range([0, viewHeight])
        .interpolate(d3.interpolateRound)
        .domain([startDepth, endDepth]);
        
    var grayScale = d3.scaleLinear()
        .range([0, 255])
        .interpolate(d3.interpolateRound)
        .domain([0, 1]);
        
    for ( var r = 0; r < dataHeight; r++ )
    {
        var depth = BHIMAGEDATA.depthValue( r );
        var depthNext = BHIMAGEDATA.depthValue( r + 1 );
        var y = depthScale( depth );
        var ySize = depthScale( depthNext ) - y;
        if ( y + ySize < 0)
        {
            continue;
        }
        if ( y > viewHeight )
        {
            continue;
        }
        
        for ( var c = 0; c < dataWidth; c++ )
        {
            context.beginPath();
            var x = azimuthScale( c );
            var xSize = azimuthScale( c + 1 ) - x;
            context.rect(x, y, xSize, ySize);
            var v = grayScale( BHIMAGEDATA.imageValue( r, c ) );
            context.fillStyle = 'rgb('+v+','+v+','+v+')';
            context.fill();
            context.closePath();
            //console.log( r +',' + c + ',' + x + ',' + y + ',' + xSize + ',' + ySize + ',' + v );
        }
    }
}

var m_ongoingTouches = [];

function copyTouch( touch )
{
    return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
}

function ongoingTouchIndexById( idToFind )
{
    for (var i = 0; i < m_ongoingTouches.length; i++)
    {
        var id = m_ongoingTouches[ i ].identifier;
    
        if ( id == idToFind ) {
            return i;
        }
    }
    return -1;    // not found
}

function handleStart( event )
{
    event.preventDefault();
    console.log("touchstart.");
    var touches = event.changedTouches;
        
    for ( var i = 0; i < touches.length; i++)
    {
        m_ongoingTouches.push( copyTouch( touches[ i ] ) );
    }
}
function handleEnd()
{
    event.preventDefault();
    console.log( "touchend." );
    var touches = event.changedTouches;
  
    for (var i = 0; i < touches.length; i++)
    {
        var idx = ongoingTouchIndexById( touches[ i ].identifier );
        m_ongoingTouches.splice( idx, 1 );  // remove it; we're done
    }
}
function handleMove()
{
    event.preventDefault();
    console.log("touchmove.");
    var touches = event.changedTouches;
  
    var idx0 = ongoingTouchIndexById( touches[ 0 ].identifier );
    var deltaY0 = Math.floor( touches[ 0 ].pageY - m_ongoingTouches[ idx0 ].pageY );
    m_ongoingTouches[ idx0 ].pageY = touches[ 0 ].pageY;
    
    var diff01 = 0;
    var deltaY1 = deltaY0;
    if ( touches.length > 1 )
    {
        var idx1 = ongoingTouchIndexById( touches[ 1 ].identifier );
        deltaY1 = Math.floor( touches[ 1 ].pageY - m_ongoingTouches[ idx1 ].pageY );
        m_ongoingTouches[ idx1 ].pageY = touches[ 1 ].pageY;
        diff01 = touches[ 1 ].pageY - touches[ 0 ].pageY;
    }
    
    adjustTopBottomView( deltaY0, deltaY1, diff01 );
        
    drawVisible(
        canvasWidth(), canvasHeight(),
        m_context, 
        m_topDepth, m_bottomDepth );
}
function handleCancel( event )
{
    event.preventDefault();
    console.log("touchcancel.");
    var touches = event.changedTouches;
  
    for (var i = 0; i < touches.length; i++)
    {
        var idx = ongoingTouchIndexById( touches[ i ].identifier );
        m_ongoingTouches.splice( idx, 1 );  // remove it; we're done
    }
}