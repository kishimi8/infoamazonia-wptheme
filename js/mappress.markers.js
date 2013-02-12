(function($) {

	mappress.markers = function(map) {

		var markers = mappress.markers;
		var markersLayer = mapbox.markers.layer();
		var features;

		map.ui.hash.add();

		$.getJSON(mappress_markers.ajaxurl,
		{
			action: 'markers_geojson',
			map_id: map.conf.postID
		},
		function(geojson) {
			markers.build(geojson);
		});

		mappress.markers.build = function(geojson) {

			map.addLayer(markersLayer);

			// do clustering
			features = markers.doClustering(geojson.features);

			markersLayer
				.features(features)
				.key(function(f) {
					return f.properties.id;
				})
				.factory(function(x) {

					if(!markers.hasLocation(x))
						return;

					var e = document.createElement('div');

					$(e).addClass('story-points')
						.addClass(x.properties.id)
						.attr('data-publisher', x.properties.source);

					$(e).data('feature', x);

					// POPUP

					var o = document.createElement('div');
					o.className = 'popup clearfix';
					e.appendChild(o);
					var content = document.createElement('div');
					content.className = 'story';
					content.innerHTML = '<span class="arrow">&nbsp;</span><small>' + x.properties.date + ' - ' + x.properties.source + '</small><h4>' + x.properties.title + '</h4>';
					o.appendChild(content);

					// cluster stuff
					if(x.properties.cluster) {

						var cluster = x.properties.cluster;
						var coords = x.geometry.coordinates;

						$(e).addClass(cluster);
						$(e).addClass('cluster');

						if(!x.properties.activeCluster) {

							x.properties.origLat = parseFloat(coords[1]);
							x.properties.origLon = parseFloat(coords[0]);

							// Story count popup
							var content = document.createElement('div');
							content.className = 'count';
							content.innerHTML = '<span class="arrow">&nbsp;</span><h4></h4>';
							o.appendChild(content);

							$(e).hover(function() {
								var len = $('.' + cluster + ':not(.hide)').length;
								if (len > 1) {
									$('.count h4', this).text(len + ' stories');
								} else {
									$(e).addClass('open');
								}
							});

						}

					}

					$(e).click(function() {

						var open = markers.collapseClusters();

						if (cluster && _.indexOf(open, cluster) == -1) {

							var cl = $('.' + cluster + ':not(.hide)');
							var step = 2 * Math.PI / cl.length;
							cl.each(function(i, el) {

								var feature = $(el).data('feature');
								var coords = feature.geometry.coordinates;

								$(el).addClass('open');

								feature.properties.activeCluster = true;

								coords[1] = parseFloat(coords[1]) + (Math.sin(step * i) * cl.length * 0.1);
								coords[0] = parseFloat(coords[0]) + (Math.cos(step * i) * cl.length * 0.1);

							});

							markersLayer.features(features);
							return;

						}

						if(!$(this).hasClass('active'))
							markers.open(x);

					});

					return e;

				});

			markers.open(geojson.features[0], true);

		};

		mappress.markers.open = function(marker, silent) {

			if(markers.hasLocation(marker) && !silent)
				map.ease.location({lat: marker.geometry.coordinates[1], lon: marker.geometry.coordinates[0]}).zoom(9).optimal();

			if(map.$.sidebar.length) {
				map.$.find('.story-points').removeClass('active');
				var $point = map.$.find('.story-points.' + marker.properties.id);
				$point.addClass('active');

				var storyData = marker.properties;

				var story = '';
				story += '<small>' + storyData.date + ' - ' + storyData.source + '</small>';
				story += '<h2 class="title">' + storyData.title + '</h2>';
				if(storyData.thumbnail)
					story += '<div class="media-limit"><img class="thumbnail" src="' + storyData.thumbnail + '" /></div>';
				story += storyData.story;

				map.$.sidebar.empty().append($(story));
			}
		};

		mappress.markers.hasLocation = function(marker) {
			if(marker.geometry.coordinates[0] ===  0 || !marker.geometry.coordinates[0])
				return false;
			else
				return true;
		}

		mappress.markers.doClustering = function(features) {

			// determine if p1 is close to p2
			var close = function(p1, p2) {

				if(!p1 || !p2)
					return false;

				var x1 = p1[1];
				var y1 = p1[0];
				var x2 = p2[1];
				var y2 = p2[0];
				d = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
				return d < 0.1;
			}

			var tested = [];
			var clusters = {};

			_.each(features, function(current, i) {

				tested.push(current);

				clusters[current.properties.id] = 0;

				// test each marker
				_.each(tested, function(f) {

					var id = f.properties.id;

					if(current.properties.id === id)
						return;

					if(close(current.geometry.coordinates, f.geometry.coordinates)) {

						var clusterID = tested.length;
						if(clusters[id] !== 0)
							clusterID = clusters[id];

						clusters[current.properties.id] = clusterID;
						clusters[id] = clusterID;

					}

				});

			});

			// save cluster to feature
			_.each(features, function(f, i) {
				if(clusters[f.properties.id] !== 0)
					features[i].properties.cluster = 'cluster-' + clusters[f.properties.id];
			});

			return features;
		}

		// Close all open clusters.
		mappress.markers.collapseClusters = function() {
			var open = [];
			map.$.find('.story-points.open').each(function(i, el) {
				// Remove open class and kill popup, which has different content
				// depending on open class.
				$(el).removeClass('open');
				//$(el).find('.popup').stop().animate({opacity: 'hide'}, 0);
				var cluster = $(el).attr('class').match(/(cluster-\d+)/);

				open.push(cluster[1]);

				var feature = $(el).data('feature');
				var coords = feature.geometry.coordinates;

				feature.properties.activeCluster = false;
				coords[1] = feature.properties.origLat;
				coords[0] = feature.properties.origLon;

			});
			markersLayer.features(features);
			return open;
		};

		mappress.markers.openClusters = function(m) {
			var radius = 0.1;
			map.$.find('.cluster:not(.open)').each(function(i, el) {

				var cluster = $(el).attr('class').match(/(cluster-\d+)/);
				var cl = $('.' + cluster[1] + ':not(.open)');

				if(cl.length) {
					var step = 2 * Math.PI / cl.length;
					cl.each(function(i, el) {
						delete el.coord; // Clear mmg internal coordinate cache.
						$(el).addClass('open');
						$(el).data('original_lat', el.location.lat);
						$(el).data('original_lon', el.location.lon);
						el.location.lat += Math.sin(step * i) * cl.length * radius;
						el.location.lon += Math.cos(step * i) * cl.length * radius;
					});
				}
			});
		};
	}

})(jQuery);