      require([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/widgets/FeatureForm",
        "esri/layers/FeatureLayer",
        "esri/layers/TileLayer",
        "esri/widgets/Measurement",
        "esri/widgets/Expand",
        "esri/widgets/BasemapGallery",
        "esri/widgets/BasemapToggle",
        "esri/widgets/Search",
        "esri/widgets/LayerList",
        "esri/widgets/LayerList/LayerListViewModel",
        "esri/widgets/Home",
        "esri/widgets/Legend",
        "esri/widgets/Print",
        "esri/widgets/Locate",
        "esri/widgets/Track",
        "esri/Graphic",
        "esri/widgets/Editor",
        "esri/layers/support/LabelClass",
        "dgrid/Grid"  
      ], function(
        esriConfig,
        Map,
        MapView,
        FeatureForm,
        FeatureLayer,
        TileLayer,
        Measurement,
        Expand,
        BasemapGallery,
        BasemapToggle,
        Search,
        LayerList,
        LayerListVM,
        Home,
        Legend,
        Print,
        Locate,
        Track,
        Graphic,
        Editor,
        LabelClass,
        Grid
      ) {
          {
        esriConfig.portalUrl = "https://maps.trpa.org/portal";
            };
          
        // Initialize variables
        let highlight, editFeatureparcelLayerView, editor, features, grid;
        
        // create the map instance
        var map = new Map({
            basemap: "topo-vector",
            });
        
        // create teh view for the map
        var view = new MapView({
              map: map,  // The WebMap instance created above
              container: "viewDiv",
              center: [-120.01,38.92],
              zoom: 13,
              // set all popups to dock in the bottom right
              popup: {
                dockEnabled: true,
                dockOptions: {
                  // sets docking spot to top left
                  position: "bottom-right"
                }
              }
            });
          

        // construct regional land use layer
        const regionalLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/LocalPlan/MapServer/9",
          title: "Regional Land Use",
          outFields: ["*"],
        });
        // add reginal land use layer to the map
        map.add(regionalLayer);
        // set to off in layer list
        regionalLayer.visible = false;
        
        // create edit action for land use in parcel popup
        const editThisAction = {
          title: "Edit Land Use",
          id: "edit-this",
          className: "esri-icon-edit"
        };

        // Create a popupTemplate for the land use layer and pass in a function to set its content and specify an action to handle editing the selected feature
        const template = {
          title: "Parcel: {APN}",
          content:[
              {
          type: "fields",
          fieldInfos: [
                {
                  fieldName: "TRPA_LANDUSE_DESCRIPTION",
                  label: "Existing Land Use"
                },
                {
                  fieldName: "COUNTY_LANDUSE_DESCRIPTION",
                  label: "County Land Use"
                },
                {
                  fieldName: "REGIONAL_LANDUSE",
                  label: "Regional Land Use",
                  },
                {
                  fieldName: "OWN_FULL",
                  label: "Owner Name"
                },
                {
                  fieldName: "OWNERSHIP_TYPE",
                  label: "Ownership Type",
                  },
                {
                  fieldName: "IMPERVIOUS_SURFACE_SQFT",
                  label: "Impervious Surface",
                  format: {
                    digitSeparator: true,
                    places: 0
                  },
                }
                ]
              }
              ],
          actions: [editThisAction],
          lastEditInfoEnabled: true              
        };
        
        // construct parcel land use layer from portal item
        const landuseLayer = new FeatureLayer({
          portalItem: {
            id: "c7fac0d4075a4eb8803fba6660a55898"
          },
          title: "Existing Land Use",
          outFields: ["*"],
          popupTemplate: template
        });
          
        // add land use layer to the map
        map.add(landuseLayer);

        // construct TRPA Boundary layer
        const builtLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/Impervious_Surface_Cached/MapServer/0",
          title: "Impervious Surface - 2010",
          outFields: ["*"],
        });
        // add impervious surface layer to the map
        map.add(builtLayer);
        // set to off in layer list
        builtLayer.visible = false;
          
        // construct town center buffer layer
        const towncenterLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/STR_Layers/MapServer/13",
          title: "Town Center - 1/4 Mile Buffer",
          outFields: ["*"],
        });
        // add town center layer to the map
        map.add(towncenterLayer);
        // set to off in layer list
        towncenterLayer.visible = false;
        
        // construct transit stop buffer layer
        const transithalfLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/STR_Layers/MapServer/11",
          title: "Transit Stop - 1/2 Mile Walk",
          outFields: ["*"],
        });
        // add town center layer to the map
        map.add(transithalfLayer);
        // set to off in layer list
        transithalfLayer.visible = false;
          
        // construct transit stop buffer layer
        const transitquarterLayer = new FeatureLayer({
          url: "https://maps.trpa.org/server/rest/services/STR_Layers/MapServer/10",
          title: "Transit Stop - 1/4 Mile Walk",
          outFields: ["*"],
        });
        // add town center layer to the map
        map.add(transitquarterLayer);
        // set to off in layer list
        transitquarterLayer.visible = false;

        // Create the zoning layer, add it to the map, and set it to off
        const zoningLayer = new FeatureLayer({
            url:
            "https://maps.trpa.org/server/rest/services/Zoning/MapServer"
          ,
            outFields: ["*"]
        });
        map.add(zoningLayer);
        zoningLayer.visible = false;
        
        const zoneLabelClass = new LabelClass({
              labelExpressionInfo: { expression: "$feature.ZONING_DESCRIPTION" },
              symbol: {
                type: "text",  // autocasts as new TextSymbol()
                color: "black",
                haloSize: 1,
                haloColor: "white",
            font: {  // autocast as new Font()
               family: "Ubuntu Light",
               size: 10,
               style: "italic"
             }
              },
            labelPlacement: "center-center",
            minScale: 10000
            });

            zoningLayer.labelingInfo = [ zoneLabelClass ];
        
        // create grid expand
        const gridExpand = new Expand({
          expandTooltip: "Show Zoning",
          expanded: false,
          view: view,
          content: document.getElementById("gridDiv"),
          expandIconClass: "esri-icon-table",
          group: "bottom-right"
        });

        // Add grid expand to the view
        view.ui.add(gridExpand, "bottom-right");

        // call clearMap method when clear is clicked
        const clearbutton = document.getElementById("clearButton");
        clearbutton.addEventListener("click", clearMap);

        zoningLayer.load().then(function() {
          return createGrid().then(function(g) {
            grid = g;
          });
        });

        view.on("click", function(event) {
          clearMap();
          queryFeatures(event);
        });

        function queryFeatures(screenPoint) {
          const point = view.toMap(screenPoint);

          // Query the layer for the feature ids where the user clicked
          zoningLayer
            .queryObjectIds({
              geometry: point,
              spatialRelationship: "intersects",
              returnGeometry: false,
              outFields: ["*"]
            })

            .then(function(objectIds) {
              if (!objectIds.length) {
                return;
              }

              // Highlight the area returned from the first query
              view.whenLayerView(zoningLayer).then(function(layerView) {
                if (highlight) {
                  highlight.remove();
                }
                highlight = layerView.highlight(objectIds);
              });

              // Query the for the related features for the features ids found
              return zoningLayer.queryRelatedFeatures({
                outFields: ["Category", "Use_Type", "Density", "Unit", "Notes"],
                relationshipId: zoningLayer.relationships[0].id,
                objectIds: objectIds
              });
            })

            .then(function(relatedFeatureSetByObjectId) {
              if (!relatedFeatureSetByObjectId) {
                return;
              }
              // Create a grid with the data
              Object.keys(relatedFeatureSetByObjectId).forEach(function(
                objectId
              ) {
                // get the attributes of the FeatureSet
                const relatedFeatureSet = relatedFeatureSetByObjectId[objectId];
                const rows = relatedFeatureSet.features.map(function(feature) {
                  return feature.attributes;
                });

                if (!rows.length) {
                  return;
                }

                // create a new div for the grid of related features
                // append to queryResults div inside of the gridDiv
                const gridDiv = document.createElement("div");
                const results = document.getElementById("queryResults");
                results.appendChild(gridDiv);

                // destroy current grid if exists
                if (grid) {
                  grid.destroy();
                }
                // create new grid to hold the results of the query
                grid = new Grid(
                  {
                    columns: {
                        Category: "Category",
                        Use_Type: "Use",
                        Density: "Density",
                        Unit: "Unit",
                        Notes: "Notes"
                        }
                  },
                  gridDiv
                );

                // add the data to the grid
                grid.renderArray(rows);
              });
              clearbutton.style.display = "inline";
            })
            .catch(function(error) {
              console.error(error);
            });
        }

        function clearMap() {
          if (highlight) {
            highlight.remove();
          }
          if (grid) {
            grid.destroy();
          }
          clearbutton.style.display = "none";
        }       

        // create the editor when a parcel popup edit action button is clicked
        view.when(function() {
          // Create the Editor with the specified layer and a list of field configurations
          editor = new Editor({
            view: view,
            container: document.createElement("div"),
            layerInfos: [
              {
                layer: landuseLayer,
                fieldConfig: [
                  {
                    name: "TRPA_LANDUSE_DESCRIPTION",
                    label: "Existing Land Use",
                    hint: "Comercial, Residential, etc.."
                  },
                  {
                    name: "COUNTY_LANDUSE_DESCRIPTION",
                    label: "County Land Use",
                    editable: false
                  },
                  {
                    name: "REGIONAL_LANDUSE",
                    label: "Regional Land Use",
                    editable: false
                    },
                  {
                    name: "OWN_FULL",
                    label: "Owner Name",
                    editable: false
                  },
                  {
                    name: "OWNERSHIP_TYPE",
                    label: "Ownership Type",
                    editable: false
                  }

                ]
              }
            ]
          });

          // Execute each time the "Edit feature" action is clicked
          function editThis() {
            // If the EditorViewModel's activeWorkflow is null, make the popup not visible
            if (!editor.viewModel.activeWorkFlow) {
              view.popup.visible = false;
              // Call the Editor update feature edit workflow

              editor.startUpdateWorkflowAtFeatureEdit(
                view.popup.selectedFeature
              );
              view.ui.add(editor, "bottom-right");
              view.popup.spinnerEnabled = false;
            }

            // We need to set a timeout to ensure the editor widget is fully rendered. We
            // then grab it from the DOM stack
            setTimeout(function() {
              // Use the editor's back button as a way to cancel out of editing
              let arrComp = editor.domNode.getElementsByClassName(
                "esri-editor__back-button esri-interactive"
              );
              if (arrComp.length === 1) {
                // Add a tooltip for the back button
                arrComp[0].setAttribute(
                  "title",
                  "Cancel edits, return to popup"
                );
                // Add a listerner to listen for when the editor's back button is clicked
                arrComp[0].addEventListener("click", function(evt) {
                  // Prevent the default behavior for the back button and instead remove the editor and reopen the popup
                  evt.preventDefault();
                  view.ui.remove(editor);
                  view.popup.open({
                    features: features
                  });
                });
              }
            }, 150);
          }

          // Event handler that fires each time an action is clicked
          view.popup.on("trigger-action", function(event) {
            if (event.action.id === "edit-this") {
              editThis();
            }
          });
        });

        // Watch when the popup is visible
        view.popup.watch("visible", function(event) {
          // Check the Editor's viewModel state, if it is currently open and editing existing features, disable popups
          if (editor.viewModel.state === "editing-existing-feature") {
            view.popup.close();
          } else {
            // Grab the features of the popup
            features = view.popup.features;
          }
        });

        landuseLayer.on("apply-edits", function() {
          // Once edits are applied to the layer, remove the Editor from the UI
          view.ui.remove(editor);

          // Iterate through the features
          features.forEach(function(feature) {
            // Reset the template for the feature if it was edited
            feature.popupTemplate = template;
          });

          // Open the popup again and reset its content after updates were made on the feature
          if (features) {
            view.popup.open({
              features: features
            });
          }

          // Cancel the workflow so that once edits are applied, a new popup can be displayed
          editor.viewModel.cancelWorkflow();
            });
                  
        // Add a legend instance to the panel of a
        // ListItem in a LayerList instance
        const layerList = new LayerList({
              view: view,
              listItemCreatedFunction: function(event) {
                const item = event.item;
                if (item.layer.type != "group") {
                  // don't show legend twice
                  item.panel = {
                    content: "legend",
                    open: false
                  };
                }
              }
        });
            
        view.ui.add(layerList, "top-right");

        // Create collapasable button for Table of Contents
        var layerListExpand = new Expand({
                expandIconClass: "esri-icon-layers",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
                expandTooltip: "Layer List",
                view: view,
                autoCollapse: true,
                content: layerList.domNode,
                group: "top-right"
            });

        // add layer list button to the top right corner of the view
        view.ui.add(layerListExpand, "top-right");

        // function to create print service
        view.when(function() {
            var print = new Print({
                container: document.createElement("div"),
                view: view,
                // specify print service url
                printServiceUrl:"https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
        });


        // Create Print Button
        var printExpand = new Expand({
            expandIconClass: "esri-icon-printer",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
            expandTooltip: "Print",
            view: view,
            autoCollapse: true,
            content: print.domNode,
            group: "top-right"
            });

        // Add print widget to the top right corner of the view
        view.ui.add(printExpand, "top-right");
        });

        var parcels = new FeatureLayer({
            url: "https://maps.trpa.org/server/rest/services/Parcels/MapServer/0",
//                popupTemplate: {
//                // autocasts as new PopupTemplate()
//                    title: "Parcel: {APN}",
//                    overwriteActions: false
//                }
        });

        // Create Search Widget
        var searchWidget = new Search({
          view: view,
          allPlaceholder: "Address or APN",
          locationEnabled: false,
          includeDefaultSources: false,
          popupEnabled: false,
          sources: [
            {
              layer: landuseLayer,
              searchFields: ["APO_ADDRESS"],
              displayField: "APO_ADDRESS",
              exactMatch: false,
              outFields: ["APO_ADDRESS"],
              name: "Address",
              zoomScale: 24000,
            },
            {
              layer: landuseLayer,
              searchFields: ["APN"],
              displayField: "APN",
              exactMatch: false,
              outFields: ["APN"],
              name: "APN",
              zoomScale: 24000,
            }
          ]
        });

        // Add the search widget to the top left corner of the view
        view.ui.add(searchWidget, {
            position: "top-left"
        });

        // move zoom buttons to top left
        view.ui.move("zoom", "top-left");

        // Createa Home Button
        var homeWidget = new Home({
            view: view
        });

        // adds the home widget to the top left corner of the MapView
        view.ui.add(homeWidget, "top-left");            

        var basemapToggle = new BasemapToggle({
            container: document.createElement("div"),
            view: view,
            nextBasemap: "hybrid"  // Allows for toggling to the "hybrid" basemap
        });

        // Create an Expand instance and set the content
        // property to the DOM node of the basemap gallery widget
        var bgExpand = new Expand({
            expandIconClass: "esri-icon-basemap",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font
            expandTooltip: "Toggle Basemap",
            view: view,
            content: basemapToggle.domNode,
            group: "bottom-left"
        });

        // Add the basemap gallery button
        view.ui.add(bgExpand, "bottom-left"); 

        // add a legend widget instance to the viewd
        const legend = new Expand({
            expandIconClass: "esri-icon-layer-list",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font
            expandTooltip: "Legend",
            content: new Legend({
                view: view,
                style: "card" // other styles include 'card'
                }),
            view: view,
            expanded: false,
            group: "bottom-left"
        });
          
        view.ui.add(legend, "bottom-left");  

        const landuseNodes = document.querySelectorAll(`.landuse-item`);
        const landuseElement = document.getElementById("landuse-filter");

        // click event handler for landuse choices
        landuseElement.addEventListener("click", filterByLandUse);

        // User clicked on landuse to set an attribute filter
        function filterByLandUse(event) {
          const selectedLanduse = event.target.getAttribute("data-landuse");
          parcelLayerView.filter = {
            where: "TRPA_LANDUSE_DESCRIPTION" + selectedLanduse
          };
        }
        
        // after land use layer loads create the widget
        view.whenLayerView(landuseLayer).then(function(layerView) {
          // land use layer loaded
          // get a reference to the land use layerview
          parcelLayerView = layerView;

        // set up UI items
        landuseElement.style.visibility = "visible";
        
        const landuseExpand = new Expand({
            view: view,
            content: landuseElement,
            expandTooltip: "Filter Land Use Type",
            expandIconClass: "esri-icon-filter",
            group: "top-right"
          });
        
        //clear the filters when user closes the expand widget
        landuseExpand.watch("expanded", function() {
            if (!landuseExpand.expanded) {
              parcelLayerView.filter = null;
            }
          });
        view.ui.add(landuseExpand, "top-right");
        });
          
      var locate = new Locate({
        view: view,
        useHeadingEnabled: false,
        goToOverride: function(view, options) {
          options.target.scale = 1500;  // Override the default map scale
          return view.goTo(options.target);
        }
      });

      view.ui.add(locate, "top-left");
        
      var track = new Track({
        view: view,
        graphic: new Graphic({
          symbol: {
            type: "simple-marker",
            size: "12px",
            color: "blue",
            outline: {
              color: "#efefef",
              width: "1.5px"
            }
          }
        }),
        useHeadingEnabled: false  // Don't change orientation of the map
      });

      view.ui.add(track, "top-left");
    });