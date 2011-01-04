(function() {
    /*
    if( window.osmify_loaded ) {
        return;
    }
    */
    function findMap() {
        for( var name in window ) {
            if( whichAPI( window[name] ) != '' ) {
              return window[name];
            }
        }
    }
    function whichAPI( o ) {
        if( ( window.GMap2 && o instanceof window.GMap2 )
         || ( window.GMap && o instanceof window.GMap ) ) {
            return 'google';
        }
        if( window.MultimapViewer && o instanceof window.MultimapViewer ) {
            return 'multimap';
        }
        if( window.VEMap && o instanceof window.VEMap ) {
            return 'virtualearth';
        }
        return '';
    }
    function mapTypeChanged() {
        var o;
        for( var i = 0, l = sel.options.length; i < l; ++i ) {
            o = custom_map_types[sel.options[i].value];
            if( ! o )
                continue;
            switch( map_api ) {
            case 'google':
                if( map.getCurrentMapType() == o.map ) {
                    sel.selectedIndex = i;
                    return;
                }
                break;
            case 'multimap':
                if( map.getMapType() == o.map ) {
                    sel.selectedIndex = i;
                    return;
                }
                break;
            }
        }
        sel.selectedIndex = 0;
    }
    function changeMapType( ) {
        var new_type = sel.options[sel.selectedIndex].value;
        var o = custom_map_types[new_type];
        if( map_api == 'virtualearth' && last_type ) {
            map.HideTileLayer( custom_map_types[last_type].label );
        }
        last_type = null;
        if( ! o )
            return;
        last_type = new_type;
        switch( map_api ) {
        case 'google':
        case 'multimap':
            map.setMapType( o.map );
            break;
        case 'virtualearth':
            map.ShowTileLayer( o.label );
            break;
        }
    }
    function makeOnClick( type ) {
        return function() {
            changeMapType( type );
        };
    }
    var map, map_api, last_type;
    if( self.MMWCore ) {
        map = self.MMWCore.UI.Mapviewer.map;
    }
    if( ! map ) {
        map = window.mapviewer;
    }
    if( ! map && window.map )
        map = window.map;
    if( ! map )
        map = findMap();
    if( ! map )
        return;
    map_api = whichAPI( map );
    var custom_map_types = {
        'mapnik' : {
            'label' : 'Mapnik',
            'callback' : function( a, b ) {
                return 'http://b.tile.openstreetmap.org/'+b+'/'+a.x+'/'+a.y+'.png'
            }
        },
        'osmarender' : {
            'label' : 'Osma',
            'callback' : function( a, b ) {
                return 'http://a.tah.openstreetmap.org/Tiles/tile/'+b+'/'+a.x+'/'+a.y+'.png';
            }
        },
        'cycle' : {
            'label' : 'Cycle',
            'callback' : function( a, b ) {
                return 'http://a.andy.sandbox.cloudmade.com/tiles/cycle/'+b+'/'+a.x+'/'+a.y+'.png';
            }
        }/*,
        'oldosmarender' : {
            'label' : 'Old OsmaRender',
            'callback' : function( a, b ) {
                return 'http://dev.openstreetmap.org/~ojw/Tiles/tile.php/'+b+'/'+a.x+'/'+a.y+'.png';
            }
        }*/
    };
    function MMmakeMap( obj ) {
        var copyright = new MMCopyright( 1, [ new MMBounds( new MMLatLon( -90, -180 ), new MMLatLon( 90, 180 ) ) ], 1, 'Open Street Map' );
        var copyrightCollection = new MMCopyrightCollection( 'Maps: ' );
        copyrightCollection.addCopyright( copyright );
        var tilelayer = new MMTileLayer( copyrightCollection, obj.minResolution ? obj.minResolution : 1, 19 );
        tilelayer.getTileUrl = function( a, b ) { return obj['callback']( a, b-1); };
        var tilelayers = [ tilelayer ];
        if( ! obj.projection )
            obj.projection = new MMMercatorProjection(20);
        obj.map = new MMMapType( tilelayers, obj.projection, obj.label );
        return obj.map;
    }
    function GmakeMap( obj ) {
        var copyright = new GCopyright( 1, new GLatLngBounds( new GLatLng( -90, -180 ), new GLatLng( 90, 180 ) ), 1, 'Open Street Map' );
        var copyrightCollection = new GCopyrightCollection( 'Maps: ' );
        copyrightCollection.addCopyright( copyright );
        var tilelayer = new GTileLayer( copyrightCollection, obj.minResolution ? obj.minResolution : 0, 18 );
        tilelayer.getTileUrl = obj['callback'];
        var tilelayers = [ tilelayer ];
        if( ! obj.projection )
            obj.projection = new GMercatorProjection(20);
        obj.map = new GMapType( tilelayers, obj.projection, obj.label );
        return obj.map;
    }
    function VEmakeMap( obj ) {
        obj.map = new VETileSourceSpecification( obj.label, 'http://johnmckerrell.com/osmviave.php?type='+obj.label+'&quad=%4' );
        return obj.map
    }
    switch( map_api ) {
    case 'multimap':
        for( var type in custom_map_types ) {
            map.addMapType( MMmakeMap( custom_map_types[type] ) );
        }
        map.addEventHandler( 'changeMapType', mapTypeChanged );
        break;
    case 'virtualearth':
        for( var type in custom_map_types ) {
            map.AddTileLayer( VEmakeMap( custom_map_types[type] ), false );
        }
        break;
    case 'google':
        for( var type in custom_map_types ) {
            map.addMapType( GmakeMap( custom_map_types[type] ) );
        }
        GEvent.addListener( map, 'maptypechanged', mapTypeChanged );
        //map.addControl(new GMapTypeControl());
        break;
    }
    var widget = document.createElement( 'div' );
    widget.className = 'OSMIFY'
    var h3 = document.createElement( 'h3' );
    widget.appendChild( h3);
    h3.appendChild( document.createTextNode( 'OSMIFY ' ) );
    var sel = document.createElement( 'select' );
    widget.appendChild( sel );
    sel.onchange = changeMapType;
    var option = document.createElement( 'option' );
    sel.appendChild( option );
    option.setAttribute( 'value', '' );
    option.appendChild( document.createTextNode( 'Not OSM' ) );
    var a = document.createElement( 'a' );
    h3.appendChild( a );
    a.href = 'javascript:void(0)';
    a.onclick = function() { widget.style.display = 'none'; };
    a.appendChild( document.createTextNode( '[X]' ) );
    for( var type in custom_map_types ) {
        option = document.createElement( 'option' );
        sel.appendChild( option );
        option.setAttribute( 'value', type )
        option.appendChild( document.createTextNode( custom_map_types[type]['label'] ) );
    }
    widget.style.position = 'absolute';
    widget.style.background = 'white';
    widget.style.border = '2px solid blue';
    widget.style.top = '30px';
    widget.style.left = '200px';
    widget.style.zIndex = 9999;
    widget.style.padding = '3px';
    widget.style.textAlign = 'center';
    h3.style.margin = '0px';
    h3.style.fontFamily = 'Georgia, sans-serif';
    a.style.fontFamily = 'Georgia, sans-serif';

    switch( map_api ) {
    case 'google':
    case 'multimap':
        map.getContainer().appendChild( widget );
        break;
    case 'virtualearth':
        map.AddControl( widget );
        break;
    }
    //window.osmify_loaded = true;
})()

