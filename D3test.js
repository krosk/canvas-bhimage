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
  	html += "</body><div id='vis'></div></html>";
  	webview.LoadHtml( html );
}

function OnReady( )
{
    var canvasWidth = window.innerWidth - 16;
    var canvasHeight = window.innerHeight - 16;
    var base = d3.select("#vis");
    var chart = base.append("canvas")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight);
    var context = chart.node().getContext("2d");
    
    var DATA_WIDTH = 36;
    var DATA_HEIGHT = 240;
    var imageData = [];
    var depthData = [];
    var lastDepth = 100;
    for ( var i = 0; i < DATA_HEIGHT; i++ )
    {
        for ( var j = 0; j < DATA_WIDTH; j++ )
        {
            imageData.push( Math.random() );
        }
        depthData.push( lastDepth );
        lastDepth += 1 + Math.random();
    }
    
    console.log( 'data loaded' );
    
    drawVisible(
        canvasWidth, canvasHeight,
        context, imageData, depthData,
        DATA_WIDTH, DATA_HEIGHT,
        150, 170);
    /*
    data.forEach(function(d, i) {
        context.beginPath();
        context.rect(scale(d), 150, 10, 10);
        context.fillStyle="red";
        context.fill();
        context.closePath();
    });
    */
}

function drawVisible(
    viewWidth, viewHeight,
    context, imageData, depthData,
    dataWidth, dataHeight,
    startDepth, endDepth)
{
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
        var depth = depthData[ r ];
        var depthNext = depthData[ r + 1 ];
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
            var index = r*dataWidth + c;
            context.beginPath();
            var x = azimuthScale( c );
            var xSize = azimuthScale( c + 1 ) - x;
            context.rect(x, y, xSize, ySize);
            var v = grayScale( imageData[ index ] );
            context.fillStyle = 'rgb('+v+','+v+','+v+')';
            context.fill();
            context.closePath();
            console.log( r +',' + c + ',' + x + ',' + y + ',' + xSize + ',' + ySize + ',' + v );
        }
    }
}